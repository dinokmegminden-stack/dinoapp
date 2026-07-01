export function generateQuestions(packageDinos, fullPool, count = 5) {
  const templates = [
    { field: 'nev_tudomanyos', text: (d) => `Mi a "${d.nev_koznapi}" tudományos neve?` },
    { field: 'korszak', text: (d) => `Melyik korszakban élt a ${d.nev_koznapi}?` },
    { field: 'hossz', text: (d) => `Mekkora volt körülbelül a ${d.nev_koznapi} testhossza?` },
    { field: 'felfedezo', text: (d) => `Ki fedezte fel a ${d.nev_koznapi}-t?` },
  ];

  const shuffle = (arr) =>
    [...arr].map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

  const combos = shuffle(
    packageDinos.flatMap((d) => templates.map((t) => ({ d, t })))
  ).slice(0, count);

  return combos.map(({ d, t }) => {
    const correct = d[t.field];
    const poolValues = [...new Set(fullPool.map((x) => x[t.field]))].filter(
      (v) => v && v !== correct && v !== 'ismeretlen'
    );
    const distractors = shuffle(poolValues).slice(0, 3);
    const options = shuffle([correct, ...distractors]);

    return {
      question: t.text(d),
      options,
      correctIndex: options.indexOf(correct),
    };
  });
}
