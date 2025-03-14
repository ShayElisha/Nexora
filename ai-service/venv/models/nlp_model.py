# models/nlp_model.py

from transformers import BertTokenizer, BertForQuestionAnswering
import torch

class NLPModel:
    def __init__(self, model_name="bert-base-multilingual-cased"):
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.model = BertForQuestionAnswering.from_pretrained(model_name)

    def answer_question(self, question, context):
        inputs = self.tokenizer(question, context, return_tensors="pt", truncation=True)
        with torch.no_grad():
            outputs = self.model(**inputs)
        start_scores = outputs.start_logits
        end_scores = outputs.end_logits

        start_idx = torch.argmax(start_scores)
        end_idx = torch.argmax(end_scores) + 1

        answer_tokens = inputs["input_ids"][0][start_idx:end_idx]
        answer = self.tokenizer.decode(answer_tokens, skip_special_tokens=True)
        return answer
