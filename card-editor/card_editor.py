import json
import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from tkinter import simpledialog
import ttkbootstrap as tb

# 读取卡牌数据
def load_cards():
    with open('config/cards.json', 'r', encoding='utf-8') as file:
        return json.load(file)

# 保存卡牌数据
def save_cards(cards):
    with open('config/cards.json', 'w', encoding='utf-8') as file:
        json.dump(cards, file, ensure_ascii=False, indent=4)

# 主界面
class MainApp(tb.Window):
    def __init__(self, cards):
        super().__init__(themename="cosmo")
        self.title("卡牌编辑器")
        self.geometry("800x600")
        self.cards = cards

        self.tree = ttk.Treeview(self, columns=("name", "type", "cardSet"), show='headings')
        self.tree.heading("name", text="名称")
        self.tree.heading("type", text="类型")
        self.tree.heading("cardSet", text="卡组")
        self.tree.pack(fill=tk.BOTH, expand=True)

        for card in self.cards:
            self.tree.insert("", tk.END, values=(card["name"], card["type"], card["cardSet"]))

        self.tree.bind("<Double-1>", self.on_double_click)

        button_frame = ttk.Frame(self)
        button_frame.pack(pady=10)

        add_button = ttk.Button(button_frame, text="新增卡牌", command=self.add_card)
        add_button.pack(side=tk.LEFT, padx=5)

        delete_button = ttk.Button(button_frame, text="删除卡牌", command=self.delete_card)
        delete_button.pack(side=tk.LEFT, padx=5)

        save_button = ttk.Button(button_frame, text="保存", command=self.save)
        save_button.pack(side=tk.LEFT, padx=5)

    def on_double_click(self, event):
        item = self.tree.selection()[0]
        card_index = self.tree.index(item)
        card = self.cards[card_index]
        CardEditor(self, card, card_index)

    def add_card(self):
        new_card = {
            "id": str(len(self.cards) + 1),
            "name": "新卡牌",
            "type": "event",
            "cardSet": "基础",
            "description": "",
            "baseWeight": 1.0,
            "choices": []
        }
        self.cards.append(new_card)
        self.tree.insert("", tk.END, values=(new_card["name"], new_card["type"], new_card["cardSet"]))

    def delete_card(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("警告", "请选择要删除的卡牌")
            return

        item = selected_item[0]
        card_index = self.tree.index(item)
        del self.cards[card_index]
        self.tree.delete(item)

    def save(self):
        save_cards(self.cards)
        messagebox.showinfo("保存", "卡牌数据已保存")

# 通用的列表编辑器
class ListEditor(tk.Toplevel):
    def __init__(self, parent, data, title, is_dict=False):
        super().__init__(parent)
        self.title(f"编辑{title}")
        self.geometry("400x400")
        self.data = data
        self.is_dict = is_dict
        self.listbox = tk.Listbox(self)
        self.listbox.pack(fill=tk.BOTH, expand=True)
        self.populate_listbox()

        button_frame = ttk.Frame(self)
        button_frame.pack(pady=10)

        add_button = ttk.Button(button_frame, text="添加", command=self.add_item)
        add_button.pack(side=tk.LEFT, padx=5)

        edit_button = ttk.Button(button_frame, text="编辑", command=self.edit_item)
        edit_button.pack(side=tk.LEFT, padx=5)

        delete_button = ttk.Button(button_frame, text="删除", command=self.delete_item)
        delete_button.pack(side=tk.LEFT, padx=5)

        save_button = ttk.Button(self, text="保存", command=self.save)
        save_button.pack(pady=10)

    def populate_listbox(self):
        self.listbox.delete(0, tk.END)
        if self.is_dict:
            for key, value in self.data.items():
                self.listbox.insert(tk.END, f"{key}: {value}")
        else:
            for item in self.data:
                self.listbox.insert(tk.END, item)

    def add_item(self):
        if self.is_dict:
            key = tk.simpledialog.askstring("键", "输入键：")
            value = tk.simpledialog.askstring("值", "输入值：")
            if key and value:
                self.data[key] = value
        else:
            item = tk.simpledialog.askstring("项", "输入项：")
            if item:
                self.data.append(item)
        self.populate_listbox()

    def edit_item(self):
        selected = self.listbox.curselection()
        if not selected:
            return
        index = selected[0]
        if self.is_dict:
            key = list(self.data.keys())[index]
            value = tk.simpledialog.askstring("值", f"编辑{key}的值：", initialvalue=self.data[key])
            if value:
                self.data[key] = value
        else:
            item = tk.simpledialog.askstring("项", "编辑项：", initialvalue=self.data[index])
            if item:
                self.data[index] = item
        self.populate_listbox()

    def delete_item(self):
        selected = self.listbox.curselection()
        if not selected:
            return
        index = selected[0]
        if self.is_dict:
            key = list(self.data.keys())[index]
            del self.data[key]
        else:
            del self.data[index]
        self.populate_listbox()

    def save(self):
        self.destroy()

# 卡牌编辑界面
class CardEditor(tk.Toplevel):
    def __init__(self, parent, card, card_index):
        super().__init__(parent)
        self.title("编辑卡牌")
        self.geometry("600x600")
        self.card = card
        self.card_index = card_index
        self.parent = parent

        self.create_widgets()

    def create_widgets(self):
        self.name_var = tk.StringVar(value=self.card.get("name", ""))
        self.type_var = tk.StringVar(value=self.card.get("type", ""))
        self.cardSet_var = tk.StringVar(value=self.card.get("cardSet", ""))
        self.description_var = tk.StringVar(value=self.card.get("description", ""))

        ttk.Label(self, text="名称").pack()
        ttk.Entry(self, textvariable=self.name_var).pack()

        ttk.Label(self, text="类型").pack()
        ttk.Entry(self, textvariable=self.type_var).pack()

        ttk.Label(self, text="卡组").pack()
        ttk.Entry(self, textvariable=self.cardSet_var).pack()

        ttk.Label(self, text="描述").pack()
        ttk.Entry(self, textvariable=self.description_var).pack()

        self.optional_fields_frame = ttk.LabelFrame(self, text="可缺省字段")
        self.optional_fields_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.baseWeight_var = tk.StringVar(value=self.card.get("baseWeight", ""))
        self.weightMultipliers_var = self.card.get("weightMultipliers", {})
        self.mustDraw_var = tk.BooleanVar(value=self.card.get("mustDraw", False))
        self.priority_var = tk.StringVar(value=self.card.get("priority", ""))
        self.timeConsumption_var = tk.StringVar(value=self.card.get("timeConsumption", ""))
        self.dateRestrictions_var = self.card.get("dateRestrictions", {})

        ttk.Label(self.optional_fields_frame, text="基础权重").pack()
        ttk.Entry(self.optional_fields_frame, textvariable=self.baseWeight_var).pack()

        weightMultipliers_button = ttk.Button(self.optional_fields_frame, text="权重乘数", command=lambda: ListEditor(self, self.weightMultipliers_var, "权重乘数", is_dict=True))
        weightMultipliers_button.pack()

        ttk.Label(self.optional_fields_frame, text="必然抽到").pack()
        ttk.Checkbutton(self.optional_fields_frame, variable=self.mustDraw_var).pack()

        ttk.Label(self.optional_fields_frame, text="优先级").pack()
        ttk.Entry(self.optional_fields_frame, textvariable=self.priority_var).pack()

        ttk.Label(self.optional_fields_frame, text="时间消耗").pack()
        ttk.Entry(self.optional_fields_frame, textvariable=self.timeConsumption_var).pack()

        dateRestrictions_button = ttk.Button(self.optional_fields_frame, text="日期限制", command=lambda: ListEditor(self, self.dateRestrictions_var, "日期限制", is_dict=True))
        dateRestrictions_button.pack()

        self.choices_frame = ttk.LabelFrame(self, text="选项")
        self.choices_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.choices_listbox = tk.Listbox(self.choices_frame)
        self.choices_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        for choice in self.card.get("choices", []):
            self.choices_listbox.insert(tk.END, choice["text"])

        self.choices_listbox.bind("<Double-1>", self.on_choice_double_click)

        add_choice_button = ttk.Button(self.choices_frame, text="添加选项", command=self.add_choice)
        add_choice_button.pack(side=tk.LEFT, padx=5)

        delete_choice_button = ttk.Button(self.choices_frame, text="删除选项", command=self.delete_choice)
        delete_choice_button.pack(side=tk.LEFT, padx=5)

        save_button = ttk.Button(self, text="保存", command=self.save)
        save_button.pack(pady=10)

    def on_choice_double_click(self, event):
        selected = self.choices_listbox.curselection()
        if not selected:
            return
        choice_index = selected[0]
        choice = self.card["choices"][choice_index]
        ChoiceEditor(self, choice, choice_index)

    def add_choice(self):
        new_choice = {
            "text": "新选项"
        }
        self.card["choices"].append(new_choice)
        self.choices_listbox.insert(tk.END, new_choice["text"])

    def delete_choice(self):
        selected = self.choices_listbox.curselection()
        if not selected:
            return
        choice_index = selected[0]
        del self.card["choices"][choice_index]
        self.choices_listbox.delete(choice_index)

    def save(self):
        self.card["name"] = self.name_var.get()
        self.card["type"] = self.type_var.get()
        self.card["cardSet"] = self.cardSet_var.get()
        self.card["description"] = self.description_var.get()

        if self.baseWeight_var.get():
            self.card["baseWeight"] = float(self.baseWeight_var.get())
        else:
            self.card.pop("baseWeight", None)

        if self.weightMultipliers_var:
            self.card["weightMultipliers"] = self.weightMultipliers_var
        else:
            self.card.pop("weightMultipliers", None)

        self.card["mustDraw"] = self.mustDraw_var.get()

        if self.priority_var.get():
            self.card["priority"] = int(self.priority_var.get())
        else:
            self.card.pop("priority", None)

        if self.timeConsumption_var.get():
            self.card["timeConsumption"] = int(self.timeConsumption_var.get())
        else:
            self.card.pop("timeConsumption", None)

        if self.dateRestrictions_var:
            self.card["dateRestrictions"] = self.dateRestrictions_var
        else:
            self.card.pop("dateRestrictions", None)

        self.parent.cards[self.card_index] = self.card
        self.parent.tree.item(self.parent.tree.get_children()[self.card_index], values=(self.card["name"], self.card["type"], self.card["cardSet"]))
        self.destroy()

# 选项编辑界面
class ChoiceEditor(tk.Toplevel):
    def __init__(self, parent, choice, choice_index):
        super().__init__(parent)
        self.title("编辑选项")
        self.geometry("400x400")
        self.choice = choice
        self.choice_index = choice_index
        self.parent = parent

        self.create_widgets()

    def create_widgets(self):
        self.text_var = tk.StringVar(value=self.choice.get("text", ""))
        self.consumeCard_var = tk.BooleanVar(value=self.choice.get("consumeCard", False))
        self.conditions_var = self.choice.get("conditions", {})
        self.effects_var = self.choice.get("effects", [])

        ttk.Label(self, text="选项文本").pack()
        ttk.Entry(self, textvariable=self.text_var).pack()

        ttk.Label(self, text="消耗卡牌").pack()
        ttk.Checkbutton(self, variable=self.consumeCard_var).pack()

        conditions_button = ttk.Button(self, text="条件", command=lambda: ListEditor(self, self.conditions_var, "条件", is_dict=True))
        conditions_button.pack(pady=5)

        effects_button = ttk.Button(self, text="效果", command=lambda: ListEditor(self, self.effects_var, "效果"))
        effects_button.pack(pady=5)

        save_button = ttk.Button(self, text="保存", command=self.save)
        save_button.pack(pady=10)

    def save(self):
        self.choice["text"] = self.text_var.get()
        self.choice["consumeCard"] = self.consumeCard_var.get()
        self.choice["conditions"] = self.conditions_var
        self.choice["effects"] = self.effects_var
        self.parent.card["choices"][self.choice_index] = self.choice
        self.parent.choices_listbox.delete(self.choice_index)
        self.parent.choices_listbox.insert(self.choice_index, self.choice["text"])
        self.destroy()

if __name__ == "__main__":
    cards_data = load_cards()
    app = MainApp(cards_data)
    app.mainloop()