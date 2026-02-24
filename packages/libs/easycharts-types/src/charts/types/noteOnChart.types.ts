import z from "zod";
import { NoteOnChartSchema } from "../schemas/noteOnChart.schemas.js";

export type NoteOnChart = z.infer<typeof NoteOnChartSchema>;
