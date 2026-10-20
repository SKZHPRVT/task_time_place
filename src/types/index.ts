export type Task = {
  id: string;
  text: string;
  done: boolean;
  reminder?: string;
};

export type Folder = {
  id: string;
  name: string;
  baseColor: string;
  bgColor: string;
  tasks: Task[];
};
