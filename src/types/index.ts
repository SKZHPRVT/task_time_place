export type Task = {
  id: string;
  text: string;
  done: boolean;
  reminder?: string; // ISO строка с датой и временем
  color?: string;    // Цвет фона задачи
};

export type List = {
  id: string;
  title: string;
  color: string;
  count: number;
};
