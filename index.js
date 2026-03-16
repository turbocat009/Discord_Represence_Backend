import express from "express";
import rateLimit from "express-rate-limit";
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

const addUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

const modifyUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});


app.post("/addUser", addUserLimiter, async (req, res) => {
    try {
        const {
            id,
            name,
            actname,
            actdesc,
            acttype,
            actimg
        } = req.body;

        if (
            !id || typeof id !== "string" ||
            !name || typeof name !== "string" ||
            !actname || typeof actname !== "string" ||
            !actdesc || typeof actdesc !== "string" ||
            !acttype || typeof acttype !== "string"
        ) {
            return res.status(400).json({ error: "Invalid input" });
        }

        if (
            id.length > 100 ||
            name.length > 100 ||
            actname.length > 100 ||
            actdesc.length > 1000 ||
            acttype.length > 50
        ) {
            return res.status(413).json({ error: "Input too long" });
        }

        const newUser = {
            id: id.trim(),
            name: name.trim(),
            actName: actname.trim(),
            actDesc: actdesc.trim(),
            actType: acttype.trim(),
            actImg: actimg.trim(),
            createdAt: new Date().toISOString()
        };

        await db.read();
        db.data.users.push(newUser);
        await db.write();

        res.status(201).json(newUser);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/modifyUser", modifyUserLimiter, async (req, res) => {
    try {
        const {
            id,
            name,
            actname,
            actdesc,
            acttype,
            actimg
        } = req.body;

        if (!id || typeof id !== "string") {
            return res.status(400).json({ error: "Invalid ID" });
        }

        await db.read();

        const user = db.data.users.find(u => u.id === id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Validate lengths if provided
        if (name && (typeof name !== "string" || name.length > 100))
            return res.status(400).json({ error: "Invalid name" });

        if (actname && (typeof actname !== "string" || actname.length > 100))
            return res.status(400).json({ error: "Invalid actname" });

        if (actdesc && (typeof actdesc !== "string" || actdesc.length > 1000))
            return res.status(400).json({ error: "Invalid actdesc" });

        if (acttype && (typeof acttype !== "string" || acttype.length > 50))
            return res.status(400).json({ error: "Invalid acttype" });

        // Update only provided fields
        if (name) user.name = name.trim();
        if (actname) user.actName = actname.trim();
        if (actdesc) user.actDesc = actdesc.trim();
        if (acttype) user.actType = acttype.trim();
        if (actimg) user.actImg = actimg.trim();

        user.updatedAt = new Date().toISOString();

        await db.write();

        res.json(user);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server ready! Listening on port ${PORT}`);
});