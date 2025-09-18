// 数据验证工具函数

// 基础验证函数
export const Validators = {
  // 必填验证
  required: (value: any, message = 'This field is required'): string | null => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  },

  // 字符串长度验证
  minLength: (min: number, message?: string) => (value: string): string | null => {
    if (typeof value !== 'string' || value.length < min) {
      return message || `Minimum length is ${min}`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: string): string | null => {
    if (typeof value === 'string' && value.length > max) {
      return message || `Maximum length is ${max}`;
    }
    return null;
  },

  // 数字范围验证
  min: (min: number, message?: string) => (value: number): string | null => {
    if (typeof value === 'number' && value < min) {
      return message || `Minimum value is ${min}`;
    }
    return null;
  },

  max: (max: number, message?: string) => (value: number): string | null => {
    if (typeof value === 'number' && value > max) {
      return message || `Maximum value is ${max}`;
    }
    return null;
  },

  // 正则表达式验证
  pattern: (regex: RegExp, message = 'Invalid format') => (value: string): string | null => {
    if (typeof value === 'string' && !regex.test(value)) {
      return message;
    }
    return null;
  },

  // 邮箱验证
  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value === 'string' && !emailRegex.test(value)) {
      return 'Invalid email format';
    }
    return null;
  },

  // URL验证
  url: (value: string): string | null => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  },

  // 数字验证
  number: (value: any): string | null => {
    if (isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return null;
  },

  // 整数验证
  integer: (value: any): string | null => {
    if (!Number.isInteger(Number(value))) {
      return 'Must be an integer';
    }
    return null;
  },

  // 布尔值验证
  boolean: (value: any): string | null => {
    if (typeof value !== 'boolean') {
      return 'Must be a boolean value';
    }
    return null;
  },

  // 数组验证
  array: (value: any): string | null => {
    if (!Array.isArray(value)) {
      return 'Must be an array';
    }
    return null;
  },

  // 对象验证
  object: (value: any): string | null => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return 'Must be an object';
    }
    return null;
  },

  // 日期验证
  date: (value: any): string | null => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Must be a valid date';
    }
    return null;
  },

  // 自定义验证
  custom: <T>(fn: (value: T) => boolean, message = 'Invalid value') => (value: T): string | null => {
    if (!fn(value)) {
      return message;
    }
    return null;
  }
};

// 验证器类型
export type Validator<T = any> = (value: T) => string | null;

// 验证规则
export interface ValidationRule<T = any> {
  validator: Validator<T>;
  message?: string;
}

// 字段验证规则
export interface FieldValidationRules<T = any> {
  [key: string]: ValidationRule<T>[] | Validator<T>[];
}

// 验证结果
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

// 验证器类
export class FormValidator<T extends Record<string, any> = Record<string, any>> {
  private rules: FieldValidationRules<any> = {};

  // 添加字段验证规则
  field<K extends keyof T>(
    fieldName: K,
    ...validators: Array<Validator<T[K]> | ValidationRule<T[K]>>
  ): this {
    this.rules[fieldName as string] = validators.map(validator => {
      if (typeof validator === 'function') {
        return { validator };
      }
      return validator;
    });
    return this;
  }

  // 验证单个字段
  validateField<K extends keyof T>(fieldName: K, value: T[K]): string[] {
    const fieldRules = this.rules[fieldName as string] || [];
    const errors: string[] = [];

    for (const rule of fieldRules) {
      let error: string | null;
      let message: string | undefined;
      
      if (typeof rule === 'function') {
        // It's a Validator function
        error = rule(value);
        message = undefined;
      } else {
        // It's a ValidationRule object
        error = rule.validator(value);
        message = rule.message;
      }
      
      if (error) {
        errors.push(message || error);
      }
    }

    return errors;
  }

  // 验证整个表单
  validate(data: T): ValidationResult {
    const errors: Record<string, string[]> = {};
    let valid = true;

    for (const fieldName in this.rules) {
      const fieldErrors = this.validateField(fieldName as keyof T, data[fieldName]);
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        valid = false;
      }
    }

    return { valid, errors };
  }

  // 异步验证
  async validateAsync(
    data: T,
    asyncValidators?: Record<keyof T, (value: any) => Promise<string | null>>
  ): Promise<ValidationResult> {
    const result = this.validate(data);
    
    if (asyncValidators) {
      const asyncErrors: Record<string, string[]> = {};
      
      for (const fieldName in asyncValidators) {
        try {
          const error = await asyncValidators[fieldName](data[fieldName]);
          if (error) {
            asyncErrors[fieldName as string] = [error];
            result.valid = false;
          }
        } catch (error) {
          asyncErrors[fieldName as string] = ['Validation error'];
          result.valid = false;
        }
      }
      
      // 合并异步验证错误
      for (const fieldName in asyncErrors) {
        if (result.errors[fieldName]) {
          result.errors[fieldName].push(...asyncErrors[fieldName]);
        } else {
          result.errors[fieldName] = asyncErrors[fieldName];
        }
      }
    }

    return result;
  }

  // 清除验证规则
  clear(): this {
    this.rules = {};
    return this;
  }
}

// 模式验证器
export class SchemaValidator {
  private schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  // 验证对象是否符合模式
  validate(data: any): ValidationResult {
    const errors: Record<string, string[]> = {};
    const valid = this.validateRecursive(data, this.schema, '', errors);
    
    return { valid, errors };
  }

  private validateRecursive(
    data: any,
    schema: any,
    path: string,
    errors: Record<string, string[]>
  ): boolean {
    let valid = true;

    if (schema.type) {
      const typeError = this.validateType(data, schema.type);
      if (typeError) {
        this.addError(errors, path, typeError);
        valid = false;
      }
    }

    if (schema.required && (data === null || data === undefined)) {
      this.addError(errors, path, 'Field is required');
      valid = false;
    }

    if (schema.properties && typeof data === 'object' && data !== null) {
      for (const prop in schema.properties) {
        const propPath = path ? `${path}.${prop}` : prop;
        const propValid = this.validateRecursive(
          data[prop],
          schema.properties[prop],
          propPath,
          errors
        );
        if (!propValid) {
          valid = false;
        }
      }
    }

    if (schema.items && Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const itemPath = `${path}[${i}]`;
        const itemValid = this.validateRecursive(data[i], schema.items, itemPath, errors);
        if (!itemValid) {
          valid = false;
        }
      }
    }

    if (schema.enum && !schema.enum.includes(data)) {
      this.addError(errors, path, `Value must be one of: ${schema.enum.join(', ')}`);
      valid = false;
    }

    if (schema.minimum !== undefined && typeof data === 'number' && data < schema.minimum) {
      this.addError(errors, path, `Value must be at least ${schema.minimum}`);
      valid = false;
    }

    if (schema.maximum !== undefined && typeof data === 'number' && data > schema.maximum) {
      this.addError(errors, path, `Value must be at most ${schema.maximum}`);
      valid = false;
    }

    if (schema.minLength !== undefined && typeof data === 'string' && data.length < schema.minLength) {
      this.addError(errors, path, `String must be at least ${schema.minLength} characters long`);
      valid = false;
    }

    if (schema.maxLength !== undefined && typeof data === 'string' && data.length > schema.maxLength) {
      this.addError(errors, path, `String must be at most ${schema.maxLength} characters long`);
      valid = false;
    }

    if (schema.pattern && typeof data === 'string' && !new RegExp(schema.pattern).test(data)) {
      this.addError(errors, path, 'String does not match required pattern');
      valid = false;
    }

    return valid;
  }

  private validateType(data: any, expectedType: string): string | null {
    switch (expectedType) {
      case 'string':
        return typeof data !== 'string' ? 'Must be a string' : null;
      case 'number':
        return typeof data !== 'number' ? 'Must be a number' : null;
      case 'boolean':
        return typeof data !== 'boolean' ? 'Must be a boolean' : null;
      case 'array':
        return !Array.isArray(data) ? 'Must be an array' : null;
      case 'object':
        return (typeof data !== 'object' || data === null || Array.isArray(data)) 
          ? 'Must be an object' : null;
      case 'null':
        return data !== null ? 'Must be null' : null;
      default:
        return null;
    }
  }

  private addError(errors: Record<string, string[]>, path: string, message: string): void {
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(message);
  }
}

// 实用工具函数
export const ValidationUtils = {
  // 创建复合验证器
  compose: <T>(...validators: Validator<T>[]): Validator<T> => {
    return (value: T): string | null => {
      for (const validator of validators) {
        const error = validator(value);
        if (error) {
          return error;
        }
      }
      return null;
    };
  },

  // 创建条件验证器
  when: <T>(
    condition: (value: T) => boolean,
    validator: Validator<T>
  ): Validator<T> => {
    return (value: T): string | null => {
      if (condition(value)) {
        return validator(value);
      }
      return null;
    };
  },

  // 创建可选验证器
  optional: <T>(validator: Validator<T>): Validator<T | null | undefined> => {
    return (value: T | null | undefined): string | null => {
      if (value === null || value === undefined) {
        return null;
      }
      return validator(value);
    };
  },

  // 清理验证错误
  sanitizeErrors: (errors: Record<string, string[]>): Record<string, string[]> => {
    const cleaned: Record<string, string[]> = {};
    
    for (const field in errors) {
      const fieldErrors = errors[field].filter(Boolean);
      if (fieldErrors.length > 0) {
        cleaned[field] = fieldErrors;
      }
    }
    
    return cleaned;
  },

  // 获取第一个错误
  getFirstError: (errors: Record<string, string[]>): string | null => {
    for (const field in errors) {
      const fieldErrors = errors[field];
      if (fieldErrors && fieldErrors.length > 0) {
        return fieldErrors[0];
      }
    }
    return null;
  },

  // 检查是否有错误
  hasErrors: (errors: Record<string, string[]>): boolean => {
    return Object.keys(errors).some(field => errors[field] && errors[field].length > 0);
  }
};