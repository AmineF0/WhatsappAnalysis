/**
 * 
 *  OBJECTIF
 *      words by time DONE
 *      words by day DONE
 *      word frequency DONE
 * 
 *      filter by person 
 *      OPTIONAL filter by date
 * 
 */
 const COLORS = [
    '#4dc9f6',
    '#f67019',
    '#f53794',
    '#537bc4',
    '#acc236',
    '#166a8f',
    '#00a950',
    '#58595b',
    '#8549ba'
  ];
  
  function color(index) {return COLORS[index % COLORS.length];}

var convo ;

function process(text){
    convo = new Conversation(text)

    var time_freq = new TimeGraphData(convo.get_word_freq_time())
    var time_freq_senders = [];
    var time_freq_senders_data = convo.get_word_freq_time_senders();
    var i=0;
    for(var elem in time_freq_senders_data){
        time_freq_senders.push({
            label: elem,
            color: color(i),
            data: (new TimeGraphData(time_freq_senders_data[elem])).data,
        });
        i++;
    }
    AreaChart("time_freq", "words in time", time_freq.labels, time_freq.data, time_freq_senders);


    var day_freq = new DayGraphData(convo.get_word_freq_day(), convo.min_day, convo.max_day)
    var day_freq_senders = [];
    var day_freq_senders_data = convo.get_word_freq_day_senders();
    i=0;
    for(var elem in day_freq_senders_data){
        day_freq_senders.push({
            label: elem,
            color: color(i),
            data: (new DayGraphData(day_freq_senders_data[elem], convo.min_day, convo.max_day)).data,
        });
        i++;
    }
    AreaChart("day_freq", "words in days", day_freq.labels, day_freq.data, day_freq_senders);

    var words_count = convo.get_words_count_senders();
    fillTable(words_count);

}

class TimeGraphData{
    constructor(time_freq){
        this.labels = this.genTime()
        this.data = []
        for(var elem of this.labels){
            this.data.push((elem in time_freq)? time_freq[elem] : 0)
        }
    }
    genTime(){
        var labels = []
        var h=0, m=0;
        while(h<24){
            labels.push(this.getTimeStr(h,m))
            m+=15
            if(m==60){
                h+=1
                m=0
            }
        }
        return labels
    }
    getTimeStr(h,m) {
        return "" + (h < 10 ? '0' : '') + h + ":" + (m < 10 ? '0' : '') + m
    }
}

class DayGraphData{
    constructor(day_freq, min_day, max_day){
        this.labels = this.genDay(min_day, max_day)
        this.data = []
        for(var elem of this.labels){
            this.data.push((elem in day_freq)? day_freq[elem] : 0)
        }
    }
    genDay(min_day, max_day){
        var labels = []
        
        const myMomentObject = moment(min_day, 'DD/MM/YYYY')

        var min_date = moment(min_day, 'DD/MM/YYYY').toDate()
        if(min_date < new Date("11/1/2021"))
             min_date = new Date("11/1/2021")
        min_date.setDate(min_date.getDate()-1)
        
        var max_date = moment(max_day, 'DD/MM/YYYY').toDate()
        max_date.setDate(max_date.getDate()+1)

        var curr = new Date(min_date.getTime())
        
        while(curr <= max_date){
            labels.push(this.getDayStr(curr))
            curr.setDate(curr.getDate()+1)
        }
        
        return labels
    }
    getDayStr(day) {
        var mm = day.getMonth() + 1; // getMonth() is zero-based
        var dd = day.getDate();
      
        return [
                (dd>9 ? '' : '0') + dd,
                (mm>9 ? '' : '0') + mm,
                day.getFullYear(),
               ].join('/');
    }
}

class STime {
    constructor(time) {
        this.time = time
        var t = time.split(" ")
        var tt = t[0].split(":")
        this.h = parseInt(tt[0])
        this.m = Math.floor(parseInt(tt[1]) / 15) * 15
        //if (t[1] == "PM") this.h = (this.h+12)%24
    }

    getTimeInt() {
        return this.h * 60 + this.m
    }
    getTimeStr() {
        return "" + (this.h < 10 ? '0' : '') + this.h + ":" + (this.m < 10 ? '0' : '') + this.m
    }
}

class Message {
    constructor(line) {
        var data = line.split(" - ");
        var ind = data[1].search(":");
        this.sender = data[1].slice(0, ind);
        this.text = data[1].slice(ind + 1).toLowerCase();
        if(this.text.localeCompare(" <media omitted>")==0) this.text="";
        this.words = this.text.split(/[\b\W\b]+/g);
        this.freq = this.get_freq();

        var timeStr = data[0].split(', ');
        this.day = moment(timeStr[0], 'DD/MM/YYYY').toDate()
        this.time = new STime(timeStr[1])
    }
    get_day(){
        var mm = this.day.getMonth() + 1; // getMonth() is zero-based
        var dd = this.day.getDate();
      
        return [
                (dd>9 ? '' : '0') + dd,
                (mm>9 ? '' : '0') + mm,
                this.day.getFullYear(),
               ].join('/');
    }
    get_freq() {
        var m = {};
        var words = this.words;

        for (var elem of words) {
            if (elem == "") continue;
            if (elem in m) m[elem]++;
            else m[elem] = 1;
        }
        return m;
    }

}

class Conversation {
    constructor(text) {
        //var t = text.split(/(\n\d{1,2}.\d{1,2}.\d{1,2},.*M - )/g).slice(1)
        var t = text.split(/(\n\d{1,2}.\d{1,2}.\d{1,2}.*- )/g).slice(1)
        
        
        this.messages = []

        for (var i = 2; i < t.length; i += 2) {
            this.messages.push(new Message((t[i] + t[i + 1]).replace('\n', ' ').trim()))
        }

        
        this.min_day = this.messages[0].day
        this.max_day = this.messages[this.messages.length-1].day

        this.senders = {}
        this.freq = this.get_freq("", true)
    }
    get_freq(sender = "", calcSenders = false) {
        var m = {}

        for (var message of this.messages) {

            if (sender != "" &&
                sender != message.sender) continue;

            var freq = message.get_freq()

            if (calcSenders) {
                if (message.sender in this.senders) {
                    this.senders[message.sender]["words"] += message.words.length
                    this.senders[message.sender]["messages"] += 1
                } else {
                    this.senders[message.sender] = {}
                    this.senders[message.sender]["words"] = message.words.length
                    this.senders[message.sender]["messages"] = 1
                }
            }

            for (var key in freq) {
                if (key in m) m[key] += freq[key];
                else m[key] = freq[key];
            }

        }
        return m;
    }
    get_word_freq_day() {
        var m = {}

        for (var message of this.messages) {
            var freq = message.freq
            var day = message.get_day()

            var cnt = 0
            for (var key in freq) cnt += freq[key]
            if (day in m) m[day] += cnt
            else m[day] = cnt
        }

        return m;
    }
    get_word_freq_time_senders() {
        var m = {}

        for (var message of this.messages) {
            var freq = message.freq
            var time = message.time.getTimeStr()
            var sender = message.sender;

            if(!(sender in m)) m[sender] = {}

            var cnt = 0
            for (var key in freq) cnt += freq[key]

            if (time in m[sender]) m[sender][time] += cnt
            else m[sender][time] = cnt
        }

        return m;
    }
    get_word_freq_day_senders() {
        var m = {}

        for (var message of this.messages) {
            var freq = message.freq
            var day = message.get_day()
            var sender = message.sender;

            if(!(sender in m)) m[sender] = {}

            var cnt = 0
            for (var key in freq) cnt += freq[key]

            if (day in m[sender]) m[sender][day] += cnt
            else m[sender][day] = cnt
        }

        return m;
    }
    get_word_freq_time() {
        var m = {}

        for (var message of this.messages) {
            var freq = message.freq
            var time = message.time.getTimeStr()

            var cnt = 0
            for (var key in freq) cnt += freq[key]
            if (time in m) m[time] += cnt
            else m[time] = cnt
        }

        return m;
    }


    get_words_count_global() {
        var sortable = [];
        for (var word in this.freq) {
            sortable.push([word, this.freq[word]]);
        }

        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });

        return {
            content: sortable,
            labels: ["words", "global count"]
        }
    }
    get_words_count_senders() {
        var labels = ["words", "global count"];
        var senders_freq = {}
        for(var sender in this.senders){
            labels.push(sender);
            senders_freq[sender] = this.get_freq(sender, false);
        }

        var sortable = [];
        for (var word in this.freq) {
            var arr = [word, this.freq[word]];

            for(var sender in this.senders){
                if(word in senders_freq[sender]) arr.push(senders_freq[sender][word])
                else arr.push(0)
            }

            sortable.push(arr);
        }

        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });

        return {
            content: sortable,
            labels: labels
        }
    }
}

function AreaChart(id, title, labels, data, others=[]){
    // Set new default font family and font color to mimic Bootstrap's default styling
    Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
    Chart.defaults.global.defaultFontColor = '#292b2c';


    var datasets = [{
        label: title,
        lineTension: 0.2,
        backgroundColor: "rgba(2,117,216,0.2)",
        borderColor: "rgba(2,117,216,1)",
        pointRadius: 1,
        pointBackgroundColor: "rgba(2,117,216,1)",
        pointBorderColor: "rgba(255,255,255,0.8)",
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgba(2,117,216,1)",
        pointHitRadius: 50,
        pointBorderWidth: 1,
        data: data
    }];

    for(var other of others){
        datasets.push(
            {
                label: other.label,
                data: other.data,
                borderColor: other.color,
                fill: false,
                cubicInterpolationMode: 'monotone',
                tension: 0.1
            }
        );
    }

    // Area Chart Example
    var ctx = document.getElementById(id);
    ctx.innerHTML = ""
    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
            xAxes: [{
                time: {
                unit: 'date'
                },
                gridLines: {
                display: true
                },
                ticks: {
                maxTicksLimit: 45
                }
            }],
            },
            legend: {
                display: true
            }
        }
    });

}

function fillTable(data){
    var header = data.labels
    var content = data.content

    document.getElementById("tableHeader").innerHTML = TableFill([header]);

    document.getElementById("tableBody").innerHTML = TableFill(content);

    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        new simpleDatatables.DataTable(datatablesSimple);
    }

}

function TableFill(dataList){
    var fill = "";
    for(var list of dataList){
        fill+="<tr>";
        for(var d of list){
            fill+="<td>"+d.toString()+"</td>"
        }
        fill+="</tr>";
    }
    return fill;
}