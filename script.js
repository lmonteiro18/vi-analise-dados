const dataFile = "./data/spotify.csv";
let treatedData;
let analisedDataTable;


//descomentar para fazer print da tabela inicial
/*d3.csv(dataFile, d3.autoType).then(tabela => {
  console.log(tabela);
});*/

//---------------------------------FUNÇÃO PARA TRATAMENTO DE DADOS---------------------------------
// NOTE: à partida os dados da nossa tabela não precisam de mais tratamento que o do autoType, para efeitos de análise
async function treatData() {
  return data = await d3.csv(dataFile, d3.autoType).then(tabela => {
    tabela.map(linha => {
      //descomentar esta parte se for para eliminar/ignorar alguma propriedade da tabela (descomentar a linha correspondente)
      /*delete linha.acousticness;
      delete linha.artist;
      delete linha.danceability;
      delete linha.duration_ms;
      delete linha.energy;
      delete linha.id;
      delete linha.instrumentalness;
      delete linha.key;
      delete linha.liveness;
      delete linha.loudness;
      delete linha.mode;
      delete linha.song_title;
      delete linha.speechiness;
      delete linha.target;
      delete linha.tempo;
      delete linha.time_signature;
      delete linha.valence;*/

      //não é para descomentar esta parte, só está aqui para vermos mais facilmente os nomes das propriedades
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

//---------------------------------FUNÇÃO PARA ANÁLISE DE DADOS---------------------------------
function dataAnalysis(data) {
  let analisedData = {};
  let n_properties = Object.keys(data[0]).length; //o método Object.keys() devolve os nomes das propriedades do objeto num array
  let property_values;
  for (let j = 0; j < n_properties; j++) {
    let property_name = Object.keys(data[0])[j];
    /*
    Abaixo está a criação de um objeto com uma propriedade para cada coluna da tabela que temos;
    essa propriedade é também um objeto com 3 propriedades:
    name -> nome da propriedade da tabela
    values -> os valores dessa propriedade em todas as linhas agrupados num array
    stats -> onde vamos guardar os valores resultantes da análise para essa propriedade (por exemplo o max ou o min)
    */
    property_values = {
      ...property_values,
      [property_name]: {
        name: property_name,
        values: [],
        stats: {}
      }
    };
    //separação dos dados de cada linha da tabela por vários arrays (um para cada propriedade)
    data.map(linha => {
      property_values[property_name].values.push(linha[property_name]);
    });

    //análise por tipo de dados de cada coluna da tabela
    // TODO: fazer a análise de dados
    if (typeof property_values[property_name].values[0] === 'number') { //se os dados forem quantitativos
      property_values[property_name].stats.max = Math.max(...property_values[property_name].values);
      property_values[property_name].stats.min = Math.min(...property_values[property_name].values);
      property_values[property_name].stats.mean = property_values[property_name].values.reduce((a, b) => a + b) / property_values[property_name].values.length;
      //property_values[property_name].values.map((value) => {});
      //console.log(property_values[property_name]);
    } else if (typeof property_values[property_name].values[0] === 'string') { //se os dados forem categóricos

    };
  }
}

//---------------------------------FUNÇÃO PARA GUARDAR DADOS---------------------------------
async function saveData() {
  treatedData = await treatData();
  analisedDataTable = await dataAnalysis(treatedData);
}

//---------------------------------FUNÇÃO PARA USAR DADOS GUARDADOS---------------------------------
async function useData() {
  await saveData(); //esta linha tem de estar sempre aqui, no início da função
  console.log(treatedData);
}

useData(); //esta linha tem de existir sempre senão não faz nada o programa
