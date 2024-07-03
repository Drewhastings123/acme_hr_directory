const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);
const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));
app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error });
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * from departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees ORDER BY created_at DESC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO employees(name, department_id) values ($1, $2) RETURNING *`;
    const response = await client.query(SQL, [
      req.body.name,

      req.body.department_id,
    ]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE employees
    SET name=$1, department_id=$2, updated_at=now()
    WHERE id=$3 RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    DELETE from employees
    WHERE id = $1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
  }
});

const PORT = process.env.PORT || 3003;
const init = async () => {
  await client.connect();
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    )
    `;
  await client.query(SQL);
  SQL = `
    INSERT INTO departments(name) VALUES('Sales');
INSERT INTO departments(name) VALUES('Finance');
INSERT INTO departments(name) VALUES('Operations');
INSERT INTO employees(name, department_id) VALUES('Wile E. Coyote', (SELECT id FROM departments WHERE name='Sales'));
INSERT INTO employees(name, department_id) VALUES('Road Runner', (SELECT id FROM departments WHERE name='Sales'));
INSERT INTO employees(name, department_id) VALUES('Tony Stark', (SELECT id FROM departments WHERE name='Finance'));
INSERT INTO employees(name, department_id) VALUES('Bucky Barnes', (SELECT id FROM departments WHERE name='Operations'));
INSERT INTO employees(name, department_id) VALUES('Steve Rogers', (SELECT id FROM departments WHERE name='Operations'));

    `;
  await client.query(SQL);
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
};

init();
