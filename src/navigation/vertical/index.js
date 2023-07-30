/*
 * Copyright (C) 2022 LINE Corporation
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import store from '@/store'

const modules = [
  {
    scope: 'normal',
    title: 'summary',
    route: 'info',
  },
  {
    scope: 'normal',
    title: 'blocks',
    route: 'blocks',
  },
  {
    scope: 'Finschia Mainnet',
    title: 'Staking (Beta)',
    route: 'staking',
  },
  {
    scope: 'normal',
    title: 'Governance',
    route: 'governance',
  },
  {
    scope: 'cos-mos',
    title: 'gravity',
    route: 'gravity',
  },
  {
    scope: 'osmosis',
    title: 'trade',
    route: 'osmosis-trade',
  },
]
const linkMenus = [
  {
    header: 'Links',
  },
  {
    title: 'Finschia Site',
    logo: '/icon/blockchain.png',
    href: 'https://finschia.network',
  },
  {
    title: 'faq',
    logo: '/icon/faq.png',
    href: 'https://finschia.network/faq',
  },
  {
    title: 'tos',
    route: 'tos',
    logo: '/icon/tos.png',
  },
  {
    title: 'contact',
    logo: '/icon/contact.png',
    href: 'mailto:lineblockchain.explorer@linecorp.com',
  },
]

function processMenu() {
  const chainMenus = [
    {
      header: 'blockchains',
    },
  ]
  const legacyChainMenus = []

  Object.keys(store.state.chains.config).forEach(chain => {
    const menu = {
      title: chain,
      logos: store.state.chains.config[chain].logos,
      route: { name: 'info', params: { chain } },
    }
    const {
      excludes,
      is_legacy: isLegacy,
      nav_menu_item_title: navMenuItemTitle,
    } = store.state.chains.config[chain]
    const children = []
    modules.forEach(m => {
      if (excludes === undefined || excludes.indexOf(m.route) === -1) {
        if (m.scope.match('normal') || m.scope.match(chain)) {
          children.push({
          // header: `item-${chain}-${m.route}`,
            title: m.title,
            route: { name: m.route, params: { chain } },
          })
        }
      }
    })
    menu.children = children
    if (navMenuItemTitle) menu.navMenuItemTitle = navMenuItemTitle
    if (isLegacy) {
      menu.isLegacy = true
      legacyChainMenus.push(menu)
    } else {
      chainMenus.push(menu)
    }
  })

  return [...chainMenus, ...linkMenus, ...legacyChainMenus]
}

export default processMenu()
