import app from './app';
import 'dotenv/config';

const PORT = process.env.PORT;

app.listen(PORT ?? 3006, () => {
    console.log(`Listening on http://localhost:${PORT}`)
});