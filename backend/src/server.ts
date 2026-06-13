import { app } from "./app.js";

const port = Number(process.env.PORT ?? 5000);

app.listen(port, () => {
  console.log(`Crossword solver API running at http://localhost:${port}`);
});

