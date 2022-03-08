const dataFile = "../data/spotify.csv";
let treatedData;
let analisedDataTable;

/*d3.csv(dataFile, d3.autoType).then(tabela => {
  console.log(tabela);
});*/

async function treatData() {
  return data = await d3.csv(dataFile, d3.autoType).then(tabela => {
    tabela.map(linha => {
      /*delete linha.acousticness;
      delete linha.id;
      delete linha.instrumentalness;
      delete linha.liveness;
      delete linha.mode;
      delete linha.speechiness;
      delete linha.target;
      delete linha.valence;*/

      /*return {
        acousticness: linha.acousticness,
        artist: linha.artist,
        danceability: linha.danceability,
        duration_ms: linha.duration_ms,
        energy: linha.energy,
        id: linha.id,
        instrumentalness: linha.instrumentalness,
        key: linha.key,
        liveness: linha.liveness,
        loudness: linha.loudness,
        mode: linha.mode,
        song_title: linha.song_title,
        speechiness: linha.speechiness,
        target: linha.target,
        tempo: linha.tempo,
        time_signature: linha.time_signature,
        valence: linha.valence
      };*/
    });
    return tabela;
  });
}

function dataAnalysis(data) {
  let analisedData = {};
  let n_properties = Object.keys(data[0]).length;
  let property_values;
  for (let j = 0; j < n_properties; j++) {
    let property_name = Object.keys(data[0])[j];
    property_values = {
      ...property_values,
      [property_name]: {
        name: property_name,
        values: [],
        stats: {}
      }
    };
    data.map(linha => {
      property_values[property_name].values.push(linha[property_name]);
    });

    if (typeof property_values[property_name].values[0] === 'number') {
      property_values[property_name].stats.max = Math.max(...property_values[property_name].values);
      property_values[property_name].stats.min = Math.min(...property_values[property_name].values);
      property_values[property_name].stats.mean = property_values[property_name].values.reduce((a, b) => a + b) / property_values[property_name].values.length;
      //property_values[property_name].values.map((value) => {});
      //console.log(property_values[property_name]);
    } else if (typeof property_values[property_name].values[0] === 'string') {

    };
  }
}

async function saveData() {
  treatedData = await treatData();
  analisedDataTable = await dataAnalysis(treatedData);
}

async function useData() {
  await saveData();
  console.log(treatedData);
}

useData();
