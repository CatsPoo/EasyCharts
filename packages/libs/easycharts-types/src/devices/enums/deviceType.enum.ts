import z from "zod";

export const deviceTypeEnum = z.enum(["Router", "Switch", "Computer", "Server","Phone"]);