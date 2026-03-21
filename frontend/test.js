async function* infiniteStream() {
  let i = 0;

  while (true) {
    await new Promise(r => setTimeout(r, 1000));
    yield `tick ${i++}`;
  }
}

for await (const data of infiniteStream()) {
  console.log(data);
}