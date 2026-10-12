FROM node:22-bookworm-slim
WORKDIR /opt/sorttrip
COPY services/hotel-browser/package*.json ./services/hotel-browser/
RUN npm --prefix services/hotel-browser ci && node services/hotel-browser/node_modules/playwright/cli.js install --with-deps chromium
COPY worker/trip-hotel-browser.js worker/supplier-browser.js ./worker/
COPY services/hotel-browser/server.mjs services/hotel-browser/service.mjs ./services/hotel-browser/
RUN useradd --create-home browser && chown -R browser:browser /opt/sorttrip && cp -R /root/.cache/ms-playwright /home/browser/.cache-playwright && chown -R browser:browser /home/browser/.cache-playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/home/browser/.cache-playwright
USER browser
EXPOSE 8794
CMD ["node","services/hotel-browser/server.mjs"]
