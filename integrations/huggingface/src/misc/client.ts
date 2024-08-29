import axios from "axios";

export const fetchModel = async (modelId: string) => {
  const { data }: { data: { modelId: string; pipeline_tag: string } } =
    await axios.get(`https://huggingface.co/api/models/${modelId}`);

  return data;
};
