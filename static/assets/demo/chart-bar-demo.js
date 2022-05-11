// // Set new default font family and font color to mimic Bootstrap's default styling
// Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
// Chart.defaults.global.defaultFontColor = '#292b2c';

// // Bar Chart Example
// var ctx = document.getElementById("myBarChart");
// var myLineChart = new Chart(ctx, {
//   type: 'bar',
//   data: {
//     labels: ["January", "February", "March", "April", "May", "June"],
//     datasets: [{
//       label: "Revenue",
//       backgroundColor: "rgba(2,117,216,1)",
//       borderColor: "rgba(2,117,216,1)",
//       data: [4215, 5312, 6251, 7841, 9821, 14984],
//     }],
//   },
//   options: {
//     scales: {
//       xAxes: [{
//         time: {
//           unit: 'month'
//         },
//         gridLines: {
//           display: false
//         },
//         ticks: {
//           maxTicksLimit: 6
//         }
//       }],
//       yAxes: [{
//         ticks: {
//           min: 0,
//           max: 15000,
//           maxTicksLimit: 5
//         },
//         gridLines: {
//           display: true
//         }
//       }],
//     },
//     legend: {
//       display: false
//     }
//   }
// });

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

 var convo ;

 function process(text){
     convo = new Conversation(text)
 
     var time_freq = new TimeGraphData(convo.get_word_freq_time())
 
     AreaChart("time_freq", "words in time", time_freq.labels, time_freq.data);
 
 
     var day_freq = new DayGraphData(convo.get_word_freq_day(), convo.min_day, convo.max_day)
     AreaChart("day_freq", "words in days", day_freq.labels, day_freq.data);
 
 
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
 
         var min_date = new Date(min_day);
         min_date.setDate(min_date.getDate()-1)
         
         var max_date = new Date(max_day);
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
                 (mm>9 ? '' : '0') + mm,
                 (dd>9 ? '' : '0') + dd,
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
         if (t[1] == "PM") this.h = (this.h+12)%24
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
         this.words = this.text.split(/[\b\W\b]+/g);
         this.freq = this.get_freq();
 
         var timeStr = data[0].split(', ');
         this.day = new Date(timeStr[0])
         this.time = new STime(timeStr[1])
     }
 
     get_day(){
         var mm = this.day.getMonth() + 1; // getMonth() is zero-based
         var dd = this.day.getDate();
       
         return [
                 (mm>9 ? '' : '0') + mm,
                 (dd>9 ? '' : '0') + dd,
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
         var t = text.split(/(\n\d{1,2}.\d{1,2}.\d{1,2},.*M - )/g).slice(1)
         
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
 }
 
 function AreaChart(id, title, labels, data){
     // Set new default font family and font color to mimic Bootstrap's default styling
     Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
     Chart.defaults.global.defaultFontColor = '#292b2c';
 
     // Area Chart Example
     var ctx = document.getElementById(id);
     ctx.innerHTML = ""
     var myLineChart = new Chart(ctx, {
         type: 'line',
         data: {
             labels: labels,
             datasets: [{
             label: title,
             lineTension: 0.,
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
             }]
         },
         options: {
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
