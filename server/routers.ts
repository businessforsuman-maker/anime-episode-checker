import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  anime: router({
    /**
     * Fetch the list of available anime items from the external API
     */
    fetchList: publicProcedure.query(async () => {
      try {
        const response = await fetch('https://data.streamindia.co.in/api/list-json');
        if (!response.ok) {
          throw new Error(`Failed to fetch list: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        throw new Error(`Error fetching anime list: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

    /**
     * Fetch episodes for a specific anime item
     */
    fetchEpisodes: publicProcedure.input(z.string()).query(async ({ input: filename }) => {
      try {
        const response = await fetch(`https://data.streamindia.co.in/api/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch episodes: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        throw new Error(`Error fetching episodes: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

    /**
     * Check if a URL is valid (no 404 or other errors)
     */
    checkUrl: publicProcedure.input(z.string()).query(async ({ input: url }) => {
      try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        return {
          url,
          valid: response.ok,
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        return {
          url,
          valid: false,
          status: 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

    /**
     * Check all episodes for a specific anime item
     */
    checkAnimeItem: publicProcedure
      .input(z.object({ filename: z.string(), startFromEpisode: z.number().default(1) }))
      .mutation(async ({ input: { filename, startFromEpisode } }) => {
        try {
          // Fetch episodes
          const episodesResponse = await fetch(`https://data.streamindia.co.in/api/${filename}`);
          if (!episodesResponse.ok) {
            throw new Error(`Failed to fetch episodes: ${episodesResponse.statusText}`);
          }
          const episodes = await episodesResponse.json();

          // Check each episode URL
          const results = [];
          const errors = [];

          for (const episode of episodes) {
            if (episode.episode < startFromEpisode) continue;

            try {
              // Check episode URL
              const episodeUrlCheck = await fetch(episode.episodeUrl, { method: 'HEAD', redirect: 'follow' });
              const episodeValid = episodeUrlCheck.ok;

              // Check video player URL if available
              let videoValid = true;
              let videoError = null;
              if (episode.videoPlayerUrl) {
                try {
                  const videoCheck = await fetch(episode.videoPlayerUrl, { method: 'HEAD', redirect: 'follow' });
                  videoValid = videoCheck.ok;
                  if (!videoValid) {
                    videoError = `Video URL returned status ${videoCheck.status}`;
                  }
                } catch (err) {
                  videoValid = false;
                  videoError = err instanceof Error ? err.message : String(err);
                }
              }

              const result = {
                episode: episode.episode,
                episodeUrl: episode.episodeUrl,
                episodeValid,
                episodeStatus: episodeUrlCheck.status,
                videoPlayerUrl: episode.videoPlayerUrl,
                videoValid,
                videoError,
              };

              if (!episodeValid || !videoValid) {
                errors.push(result);
              }
              results.push(result);
            } catch (error) {
              const errorResult = {
                episode: episode.episode,
                episodeUrl: episode.episodeUrl,
                episodeValid: false,
                error: error instanceof Error ? error.message : String(error),
              };
              errors.push(errorResult);
              results.push(errorResult);
            }
          }

          return {
            filename,
            totalEpisodes: episodes.length,
            checkedEpisodes: results.length,
            errors,
            results,
            success: errors.length === 0,
          };
        } catch (error) {
          throw new Error(`Error checking anime item: ${error instanceof Error ? error.message : String(error)}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
