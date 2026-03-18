import express from "express";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get("/users", async (req, res) => {
  try {
    const { discordID } = req.query;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", discordID)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
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

app.get("/test", async (req, res) => {
  const { data, error, status, statusText } = await supabase
    .from("users")
    .select("*");

  res.json({ data, error, status, statusText });
});


app.post("/addUser", addUserLimiter, async (req, res) => {
  try {
    const { id, name, actname, actdesc, acttype, actimg } = req.body;

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
      username: name.trim(),
      activity_name: actname.trim(),
      activity_desc: actdesc.trim(),
      activity_type: acttype.trim(),
      activity_img: actimg?.trim() || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/modifyUser", modifyUserLimiter, async (req, res) => {
  try {
    const { id, name, actname, actdesc, acttype, actimg } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Validate inputs
    if (name && (typeof name !== "string" || name.length > 100))
      return res.status(400).json({ error: "Invalid name" });

    if (actname && (typeof actname !== "string" || actname.length > 100))
      return res.status(400).json({ error: "Invalid actname" });

    if (actdesc && (typeof actdesc !== "string" || actdesc.length > 1000))
      return res.status(400).json({ error: "Invalid actdesc" });

    if (acttype && (typeof acttype !== "string" || acttype.length > 50))
      return res.status(400).json({ error: "Invalid acttype" });

    const updates = {
      ...(name && { name: name.trim() }),
      ...(actname && { actname: actname.trim() }),
      ...(actdesc && { actdesc: actdesc.trim() }),
      ...(acttype && { acttype: acttype.trim() }),
      ...(actimg && { actimg: actimg.trim() }),
      updatedat: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server ready! Listening on port ${PORT}`);
});