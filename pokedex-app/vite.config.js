// vite.config.js
import { defineConfig } from 'vite';
import ghPages from 'vite-plugin-gh-pages';

export default defineConfig({
  base: '/pokedex-app/', // Reemplaza con el nombre de tu repositorio
  plugins: [ghPages()],
});
