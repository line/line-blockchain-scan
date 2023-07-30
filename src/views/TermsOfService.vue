<!--
  Copyright (C) 2022 LINE Corporation

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along
  with this program; if not, write to the Free Software Foundation, Inc.,
  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
-->

<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <b-row>
      <b-col>
        <h2
          class="mb-2 tos-title"
          v-text="tosTitle"
        />
        <div class="card">
          <div
            class="card-body"
            v-html="tosHtml"
          />
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import {
  BRow, BCol,
} from 'bootstrap-vue'
import { landpressProject } from '@/libs/landpress-content-api'

const tosST = landpressProject.single_type.tos_common // tos_common single type

export default {
  components: {
    BRow,
    BCol,
  },
  data() {
    return {
      tosTitle: '',
      tosHtml: '',
    }
  },
  created() {
    this.$landpress.getSingleTypeMultipleFields(tosST, ['title', 'content']).then(([title, content]) => {
      this.tosTitle = title
      this.tosHtml = content
    })
  },
}
</script>
