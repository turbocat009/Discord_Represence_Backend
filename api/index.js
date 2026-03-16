import express from "express";
import rateLimit from "express-rate-limit";

const app = express();

app.use(express.json());

// Mock database (replace with real DB for persistence)
let usersData = [];

app.get("/users", async (req, res) => {
    let not = true;
    usersData.forEach((user) => {
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

        usersData.push(newUser);
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

        const userIndex = usersData.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ error: "User not found" });
        }

        if (name) usersData[userIndex].name = name.trim();
        if (actname) usersData[userIndex].actName = actname.trim();
        if (actdesc) usersData[userIndex].actDesc = actdesc.trim();
        if (acttype) usersData[userIndex].actType = acttype.trim();
        if (actimg) usersData[userIndex].actImg = actimg.trim();

        res.json(usersData[userIndex]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default app;
