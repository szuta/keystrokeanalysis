define(['mustache'], function(Mustache) {
    var text1 = document.getElementById("text1");
    $('#text1').val('');

    var keydown = { text1 : {}, text2 : {}};
    var logbuffer = { text1: [], text2: []};
    var template = $('#template').html();
    Mustache.parse(template);

    function refreshDisplay(logs) {
        var rendered = Mustache.render(template, {logs: logs});
        $('#text1log').html(rendered);
        $('#text1log')[0].scrollTop = $('#text1log')[0].scrollHeight;
        logbuffer['text1'].forEach(function(x) { console.log(x.key + "(" + x.event + "): "  + x.time) });
    }

    function logKeydown(e) {
        if (e.key in keydown[e.target.id]) {
            if (keydown[e.target.id][e.key] == 1) {
                //console.log("Ignoring " + e.key);
                return true;
            }
        }
        keydown[e.target.id][e.key] = 1;
        var logit = {
            'key': e.key,
            'time': e.timeStamp,
            'event': 'down',
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
            'event': 'up',
            'icon': '<i class="fa fa-arrow-up" aria-hidden="true"></i>',
            'badge': 'success'
        };

        logbuffer[e.target.id].push(logit);

        //console.log("Released " + e.key + " at " + e.timeStamp);
        refreshDisplay(logbuffer[e.target.id]);
    }

    text1.addEventListener('keydown', logKeydown);
    text1.addEventListener('keyup', logKeyup);
});
