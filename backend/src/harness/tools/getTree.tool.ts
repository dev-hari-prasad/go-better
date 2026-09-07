// import { z } from "zod/v4";
// import {tool} from 'ai'

//   tools: {
//     weather: tool({
//       description: 'Get the weather in a location',
//       inputSchema: z.object({
//         location: z.string().describe('The location to get the weather for'),
//       }),
//       execute: async ({ location }) => ({
//         location,
//         temperature: 72 + Math.floor(Math.random() * 21) - 10,
//       }),
//     }),
//   }