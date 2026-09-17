export function UploadForm() {
  const data = new FormData();
  return (
    <form>
      <input type="file" name="document" />
      <button type="submit">Upload {String(data)}</button>
    </form>
  );
}
