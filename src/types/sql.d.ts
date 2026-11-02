// Las migraciones de Drizzle importan archivos .sql como texto (babel-plugin-inline-import).
declare module '*.sql' {
  const content: string;
  export default content;
}
