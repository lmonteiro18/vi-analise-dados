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
      delete linha.acousticness;
      //delete linha.artist;
      delete linha.danceability;
      delete linha.duration_ms;
      //delete linha.energy;
      delete linha.id;
      delete linha.instrumentalness;
      delete linha.key;
      delete linha.liveness;
      delete linha.loudness;
      //delete linha.mode;
      delete linha.song_title;
      delete linha.speechiness;
      delete linha.target;
      delete linha.tempo;
      delete linha.time_signature;
      //delete linha.valence;

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
      property_values[property_name].stats.max = d3.max(property_values[property_name].values);
      property_values[property_name].stats.min = d3.min(property_values[property_name].values);
      property_values[property_name].stats.mean = d3.mean(property_values[property_name].values);
      property_values[property_name].stats.mode = d3.mode(property_values[property_name].values);
      property_values[property_name].stats.median = d3.median(property_values[property_name].values);
      property_values[property_name].stats.variance = d3.variance(property_values[property_name].values);
      property_values[property_name].stats.deviation = d3.deviation(property_values[property_name].values);
      property_values[property_name].stats.q1 = d3.quantileSorted(property_values[property_name].values, 0); //se estiver correto é igual ao mínimo
      property_values[property_name].stats.q2 = d3.quantileSorted(property_values[property_name].values, 0.1);
      property_values[property_name].stats.q3 = d3.quantileSorted(property_values[property_name].values, 0.2);
      property_values[property_name].stats.q4 = d3.quantileSorted(property_values[property_name].values, 0.3);
      property_values[property_name].stats.q5 = d3.quantileSorted(property_values[property_name].values, 0.4);
      property_values[property_name].stats.q6 = d3.quantileSorted(property_values[property_name].values, 0.5);
      property_values[property_name].stats.q7 = d3.quantileSorted(property_values[property_name].values, 0.6);
      property_values[property_name].stats.q8 = d3.quantileSorted(property_values[property_name].values, 0.7);
      property_values[property_name].stats.q9 = d3.quantileSorted(property_values[property_name].values, 0.8);
      property_values[property_name].stats.q10 = d3.quantileSorted(property_values[property_name].values, 0.9);
      property_values[property_name].stats.q11 = d3.quantileSorted(property_values[property_name].values, 1); //se estiver correto é igual ao máximo
      //property_values[property_name].values.map((value) => {});
      //console.log(property_values[property_name]);
    } else if (typeof property_values[property_name].values[0] === 'string') { //se os dados forem categóricos
      let all_values = property_values[property_name].values;
      //all_values.map(d=>d==="Drake" && console.log(d)); //Se quisermos ir buscar o número de músicas de alguém específico (que saibamos que esteja na lista), ou verificar se alguém está na lista
      let amostra = data.length;
      let stats = {};
      all_values.map(d => {
        stats = {
          ...stats,
          [d]: 0
        };
      });
      all_values.map(d => stats[d]++);
      property_values[property_name].stats = stats;
      console.log(property_values[property_name].stats); //número de músicas por artista
      console.log(Object.keys(property_values[property_name].stats).length); //número de artistas diferentes (alguns feats são contados como diferente)
      Object.keys(stats).map((property_name) => {
        //let freq_absoluta = (stats[property_name] / amostra).toFixed(2);
        //console.log(`${property_name} -> Freq_Absoluta: ${freq_absoluta} --- Freq_Relativa: ${freq_absoluta * 100}%`);
      });
    };
  }
  //console.log(property_values);
  return property_values;
}

//---------------------------------FUNÇÃO PARA GUARDAR DADOS---------------------------------
async function saveData() {
  treatedData = await treatData();
  analisedDataTable = await dataAnalysis(treatedData);
}

//---------------------------------FUNÇÃO PARA USAR DADOS GUARDADOS---------------------------------
async function useData() {
  await saveData(); //esta linha tem de estar sempre aqui, no início da função
  //console.log(treatedData);
  //console.log(analisedDataTable);

  let svg = d3.select("#Graphs").append("svg")
    .attr("width", "100vw")
    .attr("height", 1000)
    .style("background-color", "lightgray");

  //eixo X
  let scaleX0 = d3.scaleLinear();
  scaleX0.domain([1, 2017]).range([0, 400]);

  let scaleX = d3.scaleLinear();
  scaleX.domain([0, 1]).range([0, 200]);

  let axis1 = d3.axisBottom()
    .scale(scaleX0)
    .ticks(2)
    .tickValues([0, 2017])
    .tickFormat(d3.format(".4"));

  let axis3 = d3.axisBottom()
    .scale(scaleX)
    .ticks(5)
    .tickValues([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    .tickFormat((d, i) => i % 2 === 0 ? d : null);

  //eixo Y
  let scaleY = d3.scaleLinear();
  scaleY.domain([0, 1]).range([200, 0]);

  let axis2 = d3.axisLeft()
    .scale(scaleY)
    .ticks(5)
    .tickValues([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    .tickFormat((d, i) => i % 2 === 0 ? d : null);

  let energy_valence = [];
  for (let i = 0; i < 2017; i++) {
    energy_valence.push({
      energy: analisedDataTable.energy.values[i],
      valence: analisedDataTable.valence.values[i],
      mode: analisedDataTable.mode.values[i]
    });
  }
  //console.log(energy_valence);

  createGraphic("Energy Graphic", svg, analisedDataTable['energy'].values.sort(), axis1, axis2, scaleX0, scaleY, "red", 50, 100);
  createGraphic("Valence Graphic", svg, analisedDataTable['valence'].values.sort(), axis1, axis2, scaleX0, scaleY, "green", 600, 100);
  createGraphic("Energy Graphic", svg, energy_valence, axis3, axis2, scaleX, scaleY, "red", 50, 500);
  createGraphic("Valence Graphic", svg, energy_valence, axis3, axis2, scaleX, scaleY, "green", 600, 500);
}

useData(); //esta linha tem de existir sempre senão não faz nada o programa

function createGraphic(title, svg, dataset, axis1, axis2, scaleX, scaleY, color, offsetX, offsetY) {
  let g = svg.append("g")
    .attr("width", "100%")
    .attr("height", "100%");
  let group1 = g.append("g")
    .attr("width", "100%")
    .attr("height", "100%");
  let group2 = g.append("g")
    .attr("width", "100%")
    .attr("height", "100%");
  let group3 = g.append("g")
    .attr("width", "100%")
    .attr("height", "100%");

  group1.append("g")
    .attr("class", "axis")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("transform", `translate(${offsetX},${offsetY+200})`)
    .call(axis1);
  //-------------------------------------

  group2.append("g")
    .attr("class", "axis")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("transform", `translate(${offsetX},${offsetY})`)
    .call(axis2);
  //-------------------------------------

  //console.log(analisedDataTable['energy'].values);
  group3.append("text")
    .text(title)
    .attr("fill", "black")
    .attr("x", offsetX + 250 - 100)
    .attr("y", offsetY - 30);
  group3.selectAll("circle").data(dataset)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => {
      if (typeof d === "object") {
        return scaleX(d.valence) + offsetX;
      } else {
        //console.log("Value X: " + (scaleX(d) + offsetX));
        return scaleX(i) + offsetX;
      }
    })
    .attr("cy", (d, i) => {
      if (typeof d === "object") {
        return scaleY(d.energy) + offsetY;
      } else {
        //console.log("Value Y: " + (scaleY(d) + offsetY));
        return scaleY(d) + offsetY;
      }
    })
    .attr("r", 1.25)
    .attr("fill", (d) => {
      if (typeof d === "object") {
        if (d.mode === 0) {
          return "blue";
        } else if (d.mode === 1) {
          return "red";
        }
      } else {
        return color;
      }
    });
}
