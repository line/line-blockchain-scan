# Copyright (C) 2022 LINE Corporation

# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

FROM harbor.linecorp.com/linkpublic/node:16-alpine AS build-env
WORKDIR /app

COPY . ./

RUN yarn --frozen-lockfile
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

FROM nginx:alpine AS runner
COPY ping.conf /etc/nginx/conf.d/default.conf
COPY --from=build-env /app/dist/ /usr/share/nginx/html/
