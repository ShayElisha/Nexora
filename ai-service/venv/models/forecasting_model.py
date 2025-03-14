# models/forecasting_model.py

import torch
import torch.nn as nn

class LSTMForecast(nn.Module):
    def __init__(self, input_size=1, hidden_size=50, num_layers=1):
        super(LSTMForecast, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # הגדרת שכבות ה-LSTM
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        
        # שכבת fully-connected לחיזוי
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        # x מגיע במבנה [batch_size, sequence_length, input_size]
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        # הפעלת ה-LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # לקיחת הפלט האחרון בסדרה
        out = out[:, -1, :]
        
        # העברת הפלט דרך שכבת fully-connected
        out = self.fc(out)
        
        return out
