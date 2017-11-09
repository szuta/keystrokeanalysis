define(['mustache'], function(Mustache) {
  var text1 = document.getElementById("text1");
  $('#text1').val('');

  var keydown = { text1 : {}, text2 : {}};
  var logbuffer = { text1: [], text2: []};
  var template = $('#template').html();
  var features = [];
  var featuresDict = {};
  var ftable = $('#ftable').DataTable();

  Mustache.parse(template);

  function refreshDisplay(logs) {
    var rendered = Mustache.render(template, {logs: logs});
    $('#text1log').html(rendered);
    $('#text1log')[0].scrollTop = $('#text1log')[0].scrollHeight;
    currentlog = logbuffer['text1'];
    for(i = 0; i < currentlog.length; i++) {
      if (currentlog[i].etype == 'down') { // key press
        if (i == 0) { // first key is a down key - won't have a UD match
          currentlog[i].udmatch = true;
        }
        // find the up event for this key
        for (j = i+1; j < currentlog.length; j++) {
          if ((currentlog[i].key == currentlog[j].key) && (currentlog[j].etype == 'up')) {
            feature = {
              'type': 'H',
              'key': currentlog[i].key,
              'value': currentlog[j].time - currentlog[i].time,
              'feature': 'H' + '.' + currentlog[i].key
            }
            ftable.row.add(
              [feature.type, feature.key, feature.value]
            );
            currentlog[i].holdmatch = true;
            currentlog[j].holdmatch = true;
            features.push(feature);
            if (!(feature.feature in featuresDict)) {
             featuresDict[feature.feature] = [feature.value];
            } else {
             featuresDict[feature.feature].push(feature.value);
            }
            break;
          }
        }
      } else if (currentlog[i].etype == 'up') { // key release
        // find the next key down
        for (j = i+1; j < currentlog.length; j++) {
          if (currentlog[j].etype == 'down') {
            feature = {
              'type': 'UD',
              'key1': currentlog[i].key,
              'key2': currentlog[j].key,
              'value': currentlog[j].time - currentlog[i].time,
              'feature': 'UD' + '.' + currentlog[i].key + '.' + currentlog[j].key
            }
            ftable.row.add(
              [feature.type, feature.key1 + " " + feature.key2, feature.value]
            ).draw(false);
            currentlog[i].udmatch = true;
            currentlog[j].udmatch = true;
            features.push(feature)
            if (!(feature.feature in featuresDict)) {
             featuresDict[feature.feature] = [feature.value];
            } else {
             featuresDict[feature.feature].push(feature.value);
            }
            break;
          }
        }
      }
    }
    ftable.page('last').draw(false);
    logbuffer['text1'] = currentlog.filter(x => (!(x.holdmatch && x.udmatch)));
    refreshGraph();
  }

  function logKeydown(e) {
    if (e.key in keydown[e.target.id]) {
      if (keydown[e.target.id][e.key] == 1) {
        return true;
      }
    }
    keydown[e.target.id][e.key] = 1;
    var logit = {
      'key': e.key,
      'time': e.timeStamp,
      'etype': 'down',
      'icon': '<i class="fa fa-arrow-down" aria-hidden="true"></i>',
      'badge': 'info'
    };

    logbuffer[e.target.id].push(logit);

    refreshDisplay(logbuffer[e.target.id]);
  }

  function logKeyup(e) {
    keydown[e.target.id][e.key] = 0;
    var logit = {
      'key': e.key,
      'time': e.timeStamp,
      'etype': 'up',
      'icon': '<i class="fa fa-arrow-up" aria-hidden="true"></i>',
      'badge': 'success'
    };

    logbuffer[e.target.id].push(logit);

    refreshDisplay(logbuffer[e.target.id]);
  }

  text1.addEventListener('keydown', logKeydown);
  text1.addEventListener('keyup', logKeyup);

  function refreshGraph() {
   // process featuresDict into a circle packing friendly format
   var data = {
    "name": "Features",
    "children": []
   };
   Object.entries(featuresDict).forEach(([feature, values]) => {
    var entry = {
     "name": feature,
     "children": []
    };
    values.forEach((v, i) => {
     entry["children"].push({"name": feature+ "_" + i, "size": v});
    });
    data["children"].push(entry);
   });


   d3.select("svg g").remove();
   var svg = d3.select("svg"),
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(2,2)"),
    format = d3.format(",d");

   var pack = d3.pack().size([diameter - 4, diameter - 4]);
   root = d3.hierarchy(data)
    .sum(d => d.size)
    .sort((a, b) => b.value - a.value);

   var node = g.selectAll(".node")
    .data(pack(root).descendants())
    .enter().append("g")
     .attr("class", d => d.children ? "node" : "leaf node")
     .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
   node.append("title")
    .text(d => d.data.name + "\n" + format(d.value));

   node.append("circle")
    .attr("r", d => d.r);

   node.filter(d => !d.children).append("text")
    .attr("dy", "0.3em")
    .text(d => d.data.name.substring(0, d.r / 3));
  }
});
