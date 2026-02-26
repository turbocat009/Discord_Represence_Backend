import express from "express";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/users", async (req, res) => {
    await db.read();
    let not = true;
    db.data.users.forEach((user) => {
        if (user.id == req.query.discordID) {
            res.json(user);
            not = false;
        }
    });
    if (not) {
        res.json(null)
    }
});

app.post("/addUser", async (req, res) => {
    const newUser = { id: Date.now(), name: req.body.name };

    await db.read();
    db.data.users.push(newUser);
    await db.write();

    res.status(201).json(newUser);
});

app.listen(PORT, () => {
    console.log(`Server ready! Listening on port ${PORT}`);
});