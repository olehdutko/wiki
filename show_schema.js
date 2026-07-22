const mysql = require("mysql2/promise");
async function show() {
  const c = await mysql.createConnection({
    host: "192.168.1.132", user: "odutko", password: "123456", database: "wiki_db"
  });
  const [cols1] = await c.query("SHOW COLUMNS FROM items");
  const [cols2] = await c.query("SHOW COLUMNS FROM item_images");
  console.log("=== ITEMS ===");
  cols1.forEach(c => console.log(c.Field + " " + c.Type));
  console.log("\n=== ITEM_IMAGES ===");
  cols2.forEach(c => console.log(c.Field + " " + c.Type));
  c.end();
}
show().catch(e => console.error(e.message));
