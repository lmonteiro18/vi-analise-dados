const dataFile = "./data/spotify.csv";
let treatedData;
let analisedDataTable;

//---------------------------------FUNÇÃO PARA TRATAMENTO DE DADOS---------------------------------
async function treatData() {
  return data = await d3.csv(dataFile, d3.autoType).then(tabela => {
    tabela.map(linha => {
      //eliminação das colunas da tabela que não pretendemos utilizar
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
  let n_properties = Object.keys(data[0]).length;
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
    if (property_name === 'artist') { //se os dados forem categóricos
      let all_values = property_values[property_name].values;
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
  await saveData();

  console.log(analisedDataTable);

  const dataset = analisedDataTable.artist.stats;

  let n_artists = Object.keys(analisedDataTable.artist.stats).length;

  let artistas_porColuna = 1;
  let espacamento_horizontal = 35;
  let svg_width = n_artists / artistas_porColuna * espacamento_horizontal + 350;

  let svg = d3.select("#Graphs").append("svg")
    .attr("width", svg_width)
    .style("min-height", "60vh");

  let svg2 = d3.select("#Graphs2").append("svg")
      .attr("width", 100)
      .style("min-height", "60vh");

  let notas_labels = ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si", "Dó", "Ré", "Mi", "Fá", "Sol", "Lá"];

  //NOTA
  //variáveis círculo
  let raio_circulo = 13;
  let cx_circulo = 0;
  let cy_circulo = 0;

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
  let espacamento_vertical = 28;
  let n_linhas = 13;
  let altura_total = n_linhas * espacamento_vertical + 5;

  //linhas da pauta
  let pauta = svg.append("g")
    .attr("class", "pauta");

  for (let i = 0; i < n_linhas; i++) {
    let y_linhaPauta = altura_total - i * espacamento_vertical;
    pauta.append("line")
      .attr("class", "linha_pauta")
      .attr("x1", 60)
      .attr("y1", y_linhaPauta)
      .attr("x2", svg_width)
      .attr("y2", y_linhaPauta)
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .style("opacity", i % 2 === 1 || i === 0 || i === n_linhas - 1 ? "0.1" : "1");
    svg2.append("text")
        .attr("class", "notas_labels")
        .attr("x", 28)
        .attr("y", y_linhaPauta + 4)
        .attr("fill", "white")
        .text(notas_labels[i]);
  }

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
    .attr("valence", d => d.valence_mediana)
    .attr("key", d => d.key_moda)
    .style("transform", d => {
      let x = x_inicial + multiplicador * espacamento_horizontal;

      let keyToLineNr = d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        .range([0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]);

      let scaleYNote = key => {
        //random para decidir se a nota fica na posição mais acima ou mais abaixo
        //(uma vez que existem notas repetidas na pauta)
        if (keyToLineNr(key) < 6) { //porque as notas só se repetem até ao lá inclusive (excluindo o Si, portanto)
          if (Math.random() < 0.5) {
            return keyToLineNr(key) * espacamento_vertical;
          } else {
            return (keyToLineNr(key) + 7) * espacamento_vertical;
          }
        } else {
          return keyToLineNr(key) * espacamento_vertical;
        }
      }
      let y = altura_total - scaleYNote(d.key_moda);


      //transformações necessárias para a representação da valência
      let transformation1 = `translate(${x}px, ${y}px)`;
      let transformation2 = `rotate(180deg)`;
      let transformation3 = `scale(0.7)`;

      //avanço para que cada nota fique numa coluna diferente
      multiplicador++;

      //aplicação das transformações relativas à valência
      if (d.valence_mediana >= 0.5) {
        return transformation1 + transformation3;
      } else {
        return `${transformation1} ${transformation2} ${transformation3}`;
      }
    })
  ;

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
        return "#1DB954";
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


  //mostrar informação do artista ao fazer hover nas notas
  let notas = document.querySelectorAll(".nota");
  let info_artista = document.querySelector(".info_artista");

  window.addEventListener("mousemove", moveCursor);

  function moveCursor(e) {
    info_artista.style.top = e.pageY + "px";
    info_artista.style.left = e.pageX + "px";

    let transformation1 = "translateX(0)";
    let transformation2 = "translateX(-100%)";
    let transformation3 = "translateY(0)";
    let transformation4 = "translateY(-100%)";

    if (e.pageX < window.innerWidth / 2 && e.pageY < window.innerHeight / 2) {
      info_artista.style.transform = transformation1 + transformation3;
    } else if (e.pageX < window.innerWidth / 2 && e.pageY >= window.innerHeight / 2) {
      info_artista.style.transform = transformation1 + transformation4;
    } else if (e.pageX >= window.innerWidth / 2 && e.pageY < window.innerHeight / 2) {
      info_artista.style.transform = transformation2 + transformation3;
    } else if (e.pageX >= window.innerWidth / 2 && e.pageY >= window.innerHeight / 2) {
      info_artista.style.transform = transformation2 + transformation4;
    }
  }

  for (let j = 0; j < notas.length; j++) {
    notas[j].addEventListener("mouseenter", () => {
      let artist_name = analisedDataTable.artist.stats[j].name;
      let artist_songs = analisedDataTable.artist.stats[j].songs;

      let artist_title = document.createElement("h3");
      artist_title.innerText = artist_name;
      info_artista.append(artist_title);

      let song_list = document.createElement("ul");
      info_artista.append(song_list);

      artist_songs.map(song => {
        let song_name = document.createElement("li");
        song_name.innerText = song;
        song_name.classList.add(".song_name");
        song_list.append(song_name);
      });
      info_artista.classList.add("show_infoArtista");
    });
    notas[j].addEventListener("mouseleave", () => {
      info_artista.classList.remove("show_infoArtista");
      info_artista.innerHTML = "";
    });
  };
}

useData();
