# Example Plugin

Usage with JS SDK in a frontend context:

```javascript
import { HostClient } from "../../sdk/js/client.js";

const client = new HostClient({ baseUrl: "http://localhost:8080", pluginId: "example.hello" });

await client.writeFile("examples/hello.txt", "Hello from plugin!\n");
const files = await client.listFiles();
console.log(files);
```

