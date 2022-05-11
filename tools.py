import os
import re
import operator
import datetime
import time

def count(words):
    dict = {}
    for word in words:
        if word == '': continue
        elif word in dict: dict[word] += 1
        else: dict.update({word: 1})
    return dict

class message:
    def __init__(self, time, sender, text):
        self.time= datetime.datetime.strptime(time, '%m/%d/%y, %I:%M %p')
        self.sender=sender
        self.text=text.lower()
        self.freq={}
    
    def __init__(self, line):
        data = line.split(" - ")
        self.time = datetime.datetime.strptime(data[0], '%m/%d/%y, %I:%M %p')
        ind = data[1].find(":")
        self.sender = data[1][:ind]
        self.text = data[1][ind+1:].lower()
        self.freq = {}
    
    def get_frequency(self):
        if len(self.freq.keys()) > 0 : return self.freq
        m = {}
        words = re.split(r"[\b\W\b]+", self.text)
        self.freq = count(words)
        return self.freq
    
    def get_day(self):
        return self.time

    def __str__(self):
        return f" {self.time} {self.sender} => {self.text}"

class conversation:
    def __init__(self, text):
        print(text)
        lines = [line.replace('\n', ' ') for line in re.split(r"(\n\d{1,2}/\d{1,2}/\d{1,2},.*M - )", text)[1:] if line != '']
        print(re.split(r"(\n\d{1,2}.\d{1,2}.\d{1,2},.*M - )", text)[1:])
        self.messages = [message(lines[i].lstrip()+" "+lines[i+1]) for i in range(0,len(lines),2)]
        self.senders = {}
        self.freq = {}
    
    def get_global_frequency(self):
        if len(self.freq) : return self.freq
        self.freq = self.get_frequency(self, calcSenders=True)
        
        return self.freq

    def get_frequency(self, filter="", sender="", start_date="", end_date="", calcSenders=False):
        m = {}
        for message in self.messages:

            if sender != "" and message.sender != sender: continue
            if start_date != "" and message.get_day() < start_date: continue
            if end_date != "" and message.get_day() > end_date: continue

            freq = message.get_frequency()

            if calcSenders:
                if message.sender in self.senders.keys() : self.senders[message.sender] += 1
                else : self.senders[message.sender] = 0 

            for key, val in freq.items():
                if key in m.keys() : m[key] += val
                else : m[key] = val
        
        return dict( sorted(m.items(), key=operator.itemgetter(1),reverse=True))

    def get_words_time_frequency(self, sender="", start_date="", end_date="", ):
        m = {}

        for message in self.messages:

            if sender != "" and message.sender != sender: continue
            if start_date != "" and message.get_day() < start_date: continue
            if end_date != "" and message.get_day() > end_date: continue
            
            freq = message.get_frequency()
            day = message.get_day()

            cnt = 0
            for key, val in freq.items():
                cnt += val

            if day in m.keys() : m[day] += cnt
            else : m[day] = cnt
            
        return m

    def get_word_time_frequency(self, word, sender=""):
        m = {}
        for message in self.messages:
            if sender != "" and message.sender != sender: continue
            
            freq = message.get_frequency()
            day = message.get_day()

            cnt = 0 if not word in freq.keys() else freq[word]

            if day in m.keys() : m[day] += cnt
            else : m[day] = cnt
            
        return m

class file:
    def __init__(self, path):
        self.text = open(path, "r", encoding="utf8").read()
    def __str__(self): return self.text 

class user:
    def __init__(self , name, text):
        self.created = time.time()
        self.name = name
        self.convo = conversation(text)
        

    def gen_response(self):
        resp = {}

        resp["word_freq"] = self.convo.get_global_frequency()
        print(self.convo.senders)
        
        senders_word_freq = {}
        for sender, cnt in self.convo.senders.items():
            senders_word_freq[sender] = self.convo.get_frequency(sender=sender)
        
        resp["senders_word_freq"] = senders_word_freq

        print(resp)

        return resp

    def killable(self): return time.time() - self.created > 1000

    def id(self): return f"{self.created}{self.name}"