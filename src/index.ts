import app from './app';
import 'dotenv/config';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT ?? 3006, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
