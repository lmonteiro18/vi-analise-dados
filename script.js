const dataFile = "./data/spotify.csv";
let treatedData;
let analisedDataTable;

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
      //delete linha.key;
      delete linha.liveness;
      delete linha.loudness;
      //delete linha.mode;
      //delete linha.song_title;
      delete linha.speechiness;
      delete linha.target;
      delete linha.tempo;
      delete linha.time_signature;
      //delete linha.valence;
    });
    return tabela;
  });
}

//---------------------------------FUNÇÃO PARA ANÁLISE DE DADOS---------------------------------
function dataAnalysis(data) {
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
    if (typeof property_values[property_name].values[0] === 'string' && property_name === 'artist') { //se os dados forem categóricos
      let all_values = property_values[property_name].values;
      //all_values.map(d=>d==="Drake" && console.log(d)); //Se quisermos ir buscar o número de músicas de alguém específico (que saibamos que esteja na lista), ou verificar se alguém está na lista
      let amostra = data.length;
      let stats = {};
      all_values.map((d, i) => {
        stats = {
          ...stats,
          [d]: {
            name: d,
            songs: [],
            energies: [],
            valences: [],
            keys: [],
            modes: [],
            energy_mediana: null,
            valence_mediana: null,
            key_moda: null,
            mode_moda: null
          }
        };
      });
      all_values.map((d, i) => {
        stats[d].songs.push(property_values['song_title'].values[i]);
        stats[d].energies.push(property_values['energy'].values[i]);
        stats[d].valences.push(property_values['valence'].values[i]);
        stats[d].keys.push(property_values['key'].values[i]);
        stats[d].modes.push(property_values['mode'].values[i]);
      });
      property_values[property_name].stats = stats;
    };
  }

  //análise de músicas repetidas
  Object.keys(property_values.artist.stats).map((artist, i) => {
    let stored_songs = [];
    let matches_index = [];
    property_values.artist.stats[artist].songs.map((song, i) => {
      if (i === 0) {
        stored_songs.push(song);
      } else {
        let matches = 0;
        stored_songs.map(storedSong => {
          if (song === storedSong) {
            matches++;
            matches_index.push(i);
          }
        });
        if (matches === 0) {
          stored_songs.push(song);
        }
      }
    });
    //atualização da lista de músicas do artista
    property_values.artist.stats[artist].songs = stored_songs;

    //pseudo delete dos elementos correspondentes às músicas que ficaram marcadas como repetidas
    //pseudo porque o método delete apenas faz com que esses elementos passem a ser undefined
    matches_index.map(index => {
      delete property_values.artist.stats[artist].energies[index];
      delete property_values.artist.stats[artist].valences[index];
      delete property_values.artist.stats[artist].keys[index];
      delete property_values.artist.stats[artist].modes[index];
    });

    //delete efetivo dos elementos que têm valor undefined (filtragem que apenas guarda os valores com valor diferente disso)
    property_values.artist.stats[artist].energies = property_values.artist.stats[artist].energies.filter(value => value !== "undefined");
    property_values.artist.stats[artist].valences = property_values.artist.stats[artist].valences.filter(value => value !== "undefined");
    property_values.artist.stats[artist].keys = property_values.artist.stats[artist].keys.filter(value => value !== "undefined");
    property_values.artist.stats[artist].modes = property_values.artist.stats[artist].modes.filter(value => value !== "undefined");

    //armazenamento dos cálculos das medianas/modas
    property_values.artist.stats[artist].energy_mediana = d3.median(property_values.artist.stats[artist].energies);
    property_values.artist.stats[artist].valence_mediana = d3.median(property_values.artist.stats[artist].valences);
    property_values.artist.stats[artist].key_moda = d3.mode(property_values.artist.stats[artist].keys);
    property_values.artist.stats[artist].mode_moda = d3.mode(property_values.artist.stats[artist].modes);
  });

  //transformação do objeto stats em array para que possa ser iterado pelo d3
  let artist_array = [];
  Object.keys(property_values.artist.stats).map(artist => artist_array.push(property_values.artist.stats[artist]));
  property_values.artist.stats = artist_array;

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

  const dataset = analisedDataTable.artist.stats;

  let n_artists = Object.keys(analisedDataTable.artist.stats).length;

  let svg_width = n_artists / 3 * 35;

  let svg = d3.select("#Graphs").append("svg")
    .attr("width", svg_width)
    .style("min-height", "100vh");

  //NOTA
  //variáveis círculo
  let raio_circulo = 13;
  let cx_circulo = 0; //alterar com algo
  let cy_circulo = 0; //alterar com algo

  //variáveis polígono
  let pointX1 = cx_circulo - raio_circulo
  let pointY1 = cy_circulo
  let pointX2 = cx_circulo + raio_circulo
  let pointY2 = cy_circulo - raio_circulo
  let pointX3 = cx_circulo + raio_circulo
  let pointY3 = cy_circulo + raio_circulo

  //variáveis haste
  let stroke_haste = 3;
  let comprimento_haste = 45;

  //variáveis pauta
  let espacamento_vertical = 40;
  let n_linhas = 13; //na verdade só 5 é que aparecem
  let altura_total = n_linhas * espacamento_vertical;

  //linhas da pauta
  let pauta = svg.append("g")
    .attr("class", "pauta");

  for (let i = 0; i < n_linhas; i++) {
    let y_linhaPauta = altura_total - i * espacamento_vertical;
    pauta.append("line")
      .attr("class", "linha_pauta")
      .attr("x1", 0)
      .attr("y1", y_linhaPauta)
      .attr("x2", svg_width)
      .attr("y2", y_linhaPauta)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .style("opacity", i % 2 === 1 || i === 0 || i === n_linhas - 1 ? "0.5" : "1");
  }

  let espacamento_horizontal = 50;
  let multiplicador = 0;
  let x_inicial = 100;
  let notas_coluna = [];
  let max_notas_coluna = 3;
  let offset_validation = 0;

  //grupos para cada nota
  svg.selectAll("g").data(dataset)
    .enter()
    .append("g")
    .attr("class", "nota")
    .style("transform", (d, i) => {
      let x = x_inicial + multiplicador * espacamento_horizontal;
      let y;
      if (d.key_moda !== 11) {
        if (Math.random() <= 0.5) {
          y = altura_total - Math.floor(d.key_moda / 2) * espacamento_vertical;
        } else {
          y = altura_total - (Math.floor(d.key_moda / 2) + 6) * espacamento_vertical;
        }
      } else {
        y = altura_total - Math.floor(d.key_moda / 2) * espacamento_vertical;
      }
      console.log(d.key_moda + ", " + x + ", " + y);
      let transformation1 = `translate(${x}px, ${y}px)`;
      let transformation2 = `rotate(180deg)`;
      //let transformation3 = `translate(100px, ${altura_total - d.key_moda * espacamento_vertical}px)`;

      if (notas_coluna.length < 2) {
        for (let i = 0; i < notas_coluna.length; i++) {
          if (Math.abs(notas_coluna[i], y) >= espacamento_vertical * 3) {
            //console.log(i + ": " + Math.abs(notas_coluna[i], y));
            offset_validation++;
          }
        }
        if (offset_validation === notas_coluna.length) {
          //console.log(notas_coluna);
          notas_coluna.push(y);
        } else {
          notas_coluna = [];
          offset_validation = 0;
        }
      } else {
        //console.log(notas_coluna);
        notas_coluna = [];
        multiplicador++;
        offset_validation = 0;
      }

      //valência
      if (d.valence_mediana >= 0.5) {
        console.log("Feliz: " + i, d.valence_mediana);
        return `${transformation1}`;
      } else {
        console.log("Triste: " + i + ", " +  d.valence_mediana);
        return `${transformation1} ${transformation2}`;
      }
      //return `${transformation2} ${transformation3}`;
      //return `${transformation1} ${transformation2} ${transformation3}`;
    });

  svg.selectAll(".nota").data(dataset)
    .append("text")
    .attr("class", "info")
    .attr("x", 20)
    .style("z-index", 10)
    .attr("fill", "white")
    //.style("transform", d => d.valence_mediana < 0.5 ? "rotate(-180deg)" : null)
    .text((d, i) => {
      return i + " -> " +
        "Nota: " + d.key_moda + ", " +
        "Escala: " + d.mode_moda + ", " +
        "Energia: " + d.energy_mediana + ", " +
        "Valência: " + d.valence_mediana + ", " +
        "Nº Músicas: " + d.songs.length;
    });



  //hastes
  svg.selectAll(".nota").data(dataset)
    .append("line")
    .attr("class", "haste")
    .attr("x1", raio_circulo + cx_circulo - (stroke_haste / 2))
    .attr("y1", cy_circulo)
    .attr("x2", raio_circulo + cx_circulo - (stroke_haste / 2))
    .attr("y2", cy_circulo - comprimento_haste)
    .attr("stroke", "white")
    .attr("stroke-width", stroke_haste);

  //corpo da nota
  svg.selectAll(".nota").data(dataset)
    .append(d => {
      //escala
      if (d.mode_moda === 0) {
        //criação de um elemento svg; o primeiro argumento é a nomenclatura das tags svg e o segundo é a tag pretendida
        return document.createElementNS(d3.namespaces.svg, "polygon");
      } else if (d.mode_moda === 1) {
        return document.createElementNS(d3.namespaces.svg, "circle");
      }
    })
    .attr("class", "corpo")
    //número de músicas
    .attr("fill", d => {
      if (d.songs.length < 3) {
        return "#00C814";
      } else if (d.songs.length >= 3 && d.songs.length < 6) {
        return "#A01BFF";
      } else {
        return "#00B0FF";
      }
    })
    //atributos polígono
    .attr("points", d => d.mode_moda === 0 ? pointX1 + "," + pointY1 + " " + pointX2 + "," + pointY2 + " " + pointX3 + "," + pointY3 : null)
    //atributos círculo
    .attr("r", d => d.mode_moda === 1 ? raio_circulo : null)
    .attr("cx", d => d.mode_moda === 1 ? cx_circulo : null)
    .attr("cy", d => d.mode_moda === 1 ? cy_circulo : null);


  //bandeiras
  let posicaoY_bandeira = 7;

  svg.selectAll(".nota").data(dataset)
    .append("g")
    .attr("class", "bandeiras");

  //bandeira 1
  svg.selectAll(".bandeiras").data(dataset)
    .append("line")
    .attr("class", "bandeira1")
    .style("stroke", "white")
    .style("stroke-width", stroke_haste)
    .style("stroke-linecap", "round")
    .style("display", d => d.energy_mediana > 0.2 ? "block" : "none")
    .attr("x1", raio_circulo + cx_circulo - (stroke_haste / 2))
    .attr("y1", cy_circulo - comprimento_haste)
    .attr("x2", raio_circulo + cx_circulo - (stroke_haste / 2) + 8)
    .attr("y2", cy_circulo - comprimento_haste + posicaoY_bandeira);

  //bandeira 2
  svg.selectAll(".bandeiras").data(dataset)
    .append("line")
    .attr("class", "bandeira2")
    .style("stroke", "white")
    .style("stroke-width", stroke_haste)
    .style("stroke-linecap", "round")
    .style("display", d => d.energy_mediana > 0.4 ? "block" : "none")
    .attr("x1", raio_circulo + cx_circulo - (stroke_haste / 2))
    .attr("y1", cy_circulo - comprimento_haste + posicaoY_bandeira)
    .attr("x2", raio_circulo + cx_circulo - (stroke_haste / 2) + 8)
    .attr("y2", cy_circulo - comprimento_haste + posicaoY_bandeira * 2);

  //bandeira 3
  svg.selectAll(".bandeiras").data(dataset)
    .append("line")
    .attr("class", "bandeira3")
    .style("stroke", "white")
    .style("stroke-width", stroke_haste)
    .style("stroke-linecap", "round")
    .style("display", d => d.energy_mediana > 0.6 ? "block" : "none")
    .attr("x1", raio_circulo + cx_circulo - (stroke_haste / 2))
    .attr("y1", cy_circulo - comprimento_haste + posicaoY_bandeira * 2)
    .attr("x2", raio_circulo + cx_circulo - (stroke_haste / 2) + 8)
    .attr("y2", cy_circulo - comprimento_haste + posicaoY_bandeira * 3);

  //bandeira 4
  svg.selectAll(".bandeiras").data(dataset)
    .append("line")
    .attr("class", "bandeira4")
    .style("stroke", "white")
    .style("stroke-width", stroke_haste)
    .style("stroke-linecap", "round")
    .style("display", d => d.energy_mediana > 0.8 ? "block" : "none")
    .attr("x1", raio_circulo + cx_circulo - (stroke_haste / 2))
    .attr("y1", cy_circulo - comprimento_haste + posicaoY_bandeira * 3)
    .attr("x2", raio_circulo + cx_circulo - (stroke_haste / 2) + 8)
    .attr("y2", cy_circulo - comprimento_haste + posicaoY_bandeira * 4);

  //sustenido
  svg.selectAll(".nota").data(dataset)
    .append('circle')
    .attr('r', 4)
    .attr('cx', cx_circulo)
    .attr('cy', -(comprimento_haste) / 2)
    .attr('fill', 'white')
    .style("display", d => d.key_moda === 1 || d.key_moda === 3 || d.key_moda === 6 || d.key_moda === 8 || d.key_moda === 10 ? "block" : "none");




  /*let scaleX = d3.scaleLinear();
  scaleX.domain([0, n_artists]).range([0, n_artists * 25]);

  let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  for (let i = 0; i < 12; i++) {
    if (i % 2 == 0) {
      svg.append("line")
        .attr("x1", 300)
        .attr("x2", n_artists * 25 + 50)
        .attr("y1", i * 30 + 60)
        .attr("y2", i * 30 + 60)
        .attr("stroke-width", 1)
        .attr("stroke", "black");
    }
  }

  for (let i = 0; i < n_artists; i++) {
    let x = scaleX(i) + 50;
    let y = 0;
    //circulo ou poligono
    if (n_musicas <= 2) { //artistas com duas músicas ou menos
      svg.append("polygon")
        .attr("x", 300)
        .attr("y", i * 25 + 50)
        .attr("points", )
        .attr("fill", "red");
    } else if (n_musicas >= 3 && n_musicas <= 5) { //artistas com entre três e 5 músicas (inclusive)
      svg.append("polygon")
        .attr("x", 300)
        .attr("y", i * 25 + 50)
        .attr("fill", "red");
    } else { //artistas com mais de 5 músicas
      svg.append("circle")
        .attr("cx", 300)
        .attr("cy", i * 25 + 50)
        .attr("fill", "red");
    }
    //haste
    svg.append("line")
      .attr("x1", 300)
      .attr("x2", n_artists * 25 + 50)
      .attr("y1", i * 50 + 50)
      .attr("y2", i * 50 + 50)
      .attr("stroke-width", 1)
      .attr("stroke", "black");
    //tracinhos
    for (let j = 0; j < energy_group; j++) {
      svg.append("line")
        .attr("x1", 300)
        .attr("x2", n_artists * 25 + 50)
        .attr("y1", i * 50 + 50)
        .attr("y2", i * 50 + 50)
        .attr("stroke-width", 1)
        .attr("stroke", "black");
    }
  }*/

  /*
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
    */
  //console.log(energy_valence);

  //------------------------------------------------GRÁFICOS------------------------------------------------
  //createGraphic("Energy Graphic", svg, analisedDataTable['energy'].values.sort(), axis1, axis2, scaleX0, scaleY, "red", 50, 100);
  //createGraphic("Valence Graphic", svg, analisedDataTable['valence'].values.sort(), axis1, axis2, scaleX0, scaleY, "green", 600, 100);
  //createGraphic("Energy Graphic", svg, energy_valence, axis3, axis2, scaleX, scaleY, "red", 50, 500);
  //createGraphic("Valence Graphic", svg, energy_valence, axis3, axis2, scaleX, scaleY, "green", 600, 500);
  //--------------------------------------------------------------------------------------------------------
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
