const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// Path to the JSON file
const dbPath = path.join(__dirname, "db.json");

// Utility function to read the JSON file
const readDB = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(dbPath, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
};

// Utility function to write to the JSON file
const writeDB = (data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// READ: Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await readDB();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading database");
  }
});

// READ: Get a product by ID
app.get("/api/products/:id", async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  try {
    const products = await readDB();
    const product = products.find((p) => p.productId === productId);
    if (product) res.json(product);
    else res.status(404).send("Product not found");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading database");
  }
});

// CREATE: Add a new product
app.post("/api/products", async (req, res) => {
  const newProduct = req.body;
  try {
    const products = await readDB();
    // Auto-increment productId
    newProduct.productId =
      products.length > 0 ? products[products.length - 1].productId + 1 : 1;
    products.push(newProduct);
    await writeDB(products);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error writing to database");
  }
});

// UPDATE: Update an existing product by ID
app.put("/api/products/:id", async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const updatedProduct = req.body;
  try {
    const products = await readDB();
    const index = products.findIndex((p) => p.productId === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct, productId }; // Ensure productId remains unchanged
      await writeDB(products);
      res.json(products[index]);
    } else {
      res.status(404).send("Product not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating database");
  }
});

// DELETE: Delete a product by ID
app.delete("/api/products/:id", async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  try {
    const products = await readDB();
    const filteredProducts = products.filter((p) => p.productId !== productId);
    if (products.length !== filteredProducts.length) {
      await writeDB(filteredProducts);
      res.sendStatus(204); // No content
    } else {
      res.status(404).send("Product not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error writing to database");
  }
});

// SEARCH: Search for products by title or description
app.get("/api/products/search", async (req, res) => {
  const { query } = req.query; // Query parameter for search
  try {
    const products = await readDB();
    const filteredProducts = products.filter(
      (product) =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );
    res.json(filteredProducts);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error searching database");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/api/products`);
});
