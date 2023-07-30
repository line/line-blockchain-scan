// https://wiki.linecorp.com/display/blockchain/LBS_v1.2.1.2_Overview
export const HIDDEN_VALIDATOR_STATUSES = [
  'BOND_STATUS_UNBONDED',
  'BOND_STATUS_UNBONDING',
]

export default {
  HIDDEN_VALIDATOR_STATUSES,
}

// NOTE: do not change the order between validators of this since the index number is used for sorting
// Read more: https://line-enterprise.slack.com/archives/C03PCPW8LTF/p1689236015245729?thread_ts=1689235966.324249&cid=C03PCPW8LTF
export const VALIDATORS_OWNED_BY_LINE_AFFILIATES = {
  alpha: [
    'linkvaloper1qxe7d2csjf3l8hyjlc2h9nq9qk692m872zxu3y', // LINE Xenesis
    'linkvaloper18yk6lq7ej822rv4yf7rcmhjewk34kxadlzj42c', // ZVC
    'linkvaloper1rr7hw4exg9lzxe07j8hvw095vkks6et6xcdkdz', // LINE NEXT Inc. (or DOSI)
    'linkvaloper1gw36l46gtknn6ekmy024lj9lgqnl7he0yrjsrd', // LINE NEXT Corp.
  ],
  // https://wiki.linecorp.com/pages/viewpage.action?pageId=3773944622
  beta: [
    'linkvaloper1qxe7d2csjf3l8hyjlc2h9nq9qk692m872zxu3y', // LINE Xenesis
    'linkvaloper18yk6lq7ej822rv4yf7rcmhjewk34kxadlzj42c', // ZVC
    'linkvaloper1rr7hw4exg9lzxe07j8hvw095vkks6et6xcdkdz', // LINE NEXT Inc. (or DOSI)
    'linkvaloper1gw36l46gtknn6ekmy024lj9lgqnl7he0yrjsrd', // LINE NEXT Corp.
  ],
  prod: [
    'linkvaloper1w7efq4znyzxp4lh07hzhzr95xzqhchymswwsh4', // LINE Xenesis
    'linkvaloper1rf78n7ucrqdlx7pjjstq5cnucj5yzhnuuh20jl', // ZVC
    'linkvaloper1as0hfqv66rvdcpqca3fayhantc5cwr6mwfa4qu', // LINE NEXT Inc. (or DOSI)
    'linkvaloper1dmn3u709328klcyjyf4w2yw4l9gs02vpmyjhdm', // Soft Bank (SBKK)
    'linkvaloper1l9cnan2pu3qs2wv4dad06d5ldq2ngeehdp3gjp', // LINE NEXT Corp.
  ],
}

export const VALIDATORS_OWNED_BY_US_COMPANIES = {
  alpha: [
    'linkvaloper1rr7hw4exg9lzxe07j8hvw095vkks6et6xcdkdz', // LINE NEXT Inc.
    'linkvaloper1pef270kpnufy88kt5fclu6qa278ckz3cxf95hv', // Certik
  ],
  // https://wiki.linecorp.com/pages/viewpage.action?pageId=3773944622
  beta: [
    'linkvaloper1rr7hw4exg9lzxe07j8hvw095vkks6et6xcdkdz', // LINE NEXT Inc.
    'linkvaloper1pef270kpnufy88kt5fclu6qa278ckz3cxf95hv', // Certik
  ],
  prod: [
    'linkvaloper1as0hfqv66rvdcpqca3fayhantc5cwr6mwfa4qu', // LINE NEXT Inc.
    'linkvaloper1k4zt4wv9ztvzevw2x2hzfwc3x3zwnr47vjtf2v', // Certik
  ],
}

export const VALIDATORS_FGM = {
  alpha: [
    'linkvaloper1gw36l46gtknn6ekmy024lj9lgqnl7he0yrjsrd', // LINE NEXT Corp.
    'linkvaloper1rr7hw4exg9lzxe07j8hvw095vkks6et6xcdkdz', // LINE NEXT Inc.
    'linkvaloper1qxe7d2csjf3l8hyjlc2h9nq9qk692m872zxu3y', // LINE Xenesis
    'linkvaloper1pef270kpnufy88kt5fclu6qa278ckz3cxf95hv', // Certik
    'linkvaloper18yk6lq7ej822rv4yf7rcmhjewk34kxadlzj42c', // ZVC
    'linkvaloper19ljpzrccpvt632uwx0mpqufg2sv50ftqkuet0y', // a4x
    'linkvaloper17awsqem50nu4v5ck2ckvs62dlt7gvzqnyxtj89', // GGL
  ],
  // https://wiki.linecorp.com/pages/viewpage.action?pageId=3773944622
  beta: [
    'linkvaloper1gw36l46gtknn6ekmy024lj9lgqnl7he0yrjsrd', // LINE NEXT Corp.
    'linkvaloper1rr7hw4exg9lzxe07j8hvw095vkks6et6xcdkdz', // LINE NEXT Inc.
    'linkvaloper1qxe7d2csjf3l8hyjlc2h9nq9qk692m872zxu3y', // LINE Xenesis
    'linkvaloper1pef270kpnufy88kt5fclu6qa278ckz3cxf95hv', // Certik
    'linkvaloper18yk6lq7ej822rv4yf7rcmhjewk34kxadlzj42c', // ZVC
    'linkvaloper19ljpzrccpvt632uwx0mpqufg2sv50ftqkuet0y', // a4x
    'linkvaloper17awsqem50nu4v5ck2ckvs62dlt7gvzqnyxtj89', // GGL
  ],
  // https://wiki.linecorp.com/display/blockchain/LBS_v1.2.2_Overview
  prod: [
    'linkvaloper1l9cnan2pu3qs2wv4dad06d5ldq2ngeehdp3gjp', // LINE NEXT Corp.
    'linkvaloper1as0hfqv66rvdcpqca3fayhantc5cwr6mwfa4qu', // LINE NEXT Inc.
    'linkvaloper1w7efq4znyzxp4lh07hzhzr95xzqhchymswwsh4', // LINE Xenesis
    'linkvaloper1dmn3u709328klcyjyf4w2yw4l9gs02vpmyjhdm', // Soft Bank (SBKK)
    'linkvaloper1mwmxgnpk0k3cv58qeas6fgkgu20qazvxynqdtf', // Crescendo
    'linkvaloper163ehzt05jhyfu5takr5s9h9el9vtg490w8tj5m', // Ahnlab
    'linkvaloper1rcd5vrmy2cln0znt4davcxhz3npkcl7x4a9h5t', // A4X
    'linkvaloper1qqp5gdrslenvdn0tg5z9rypn8qpezfvee872mh', // PrestoLabs
    'linkvaloper17se38rc4q9wvm6nmm6fx6pqfdylnm7n2vc0vh8', // Good Gang Labs
    'linkvaloper1k4zt4wv9ztvzevw2x2hzfwc3x3zwnr47vjtf2v', // Certik
    'linkvaloper1rf78n7ucrqdlx7pjjstq5cnucj5yzhnuuh20jl', // ZVC
    'linkvaloper1nddwnkc47p9v9apruhp9xtq4rquf2y495vv8ss', // Neopin
    'linkvaloper1w9003ln4t044dmzzhaxh84an0z8rru2wjtup0y', // MarbleX
  ],
}

export const VALIDATORS_FOUNDATION = {
  alpha: [
    'Flourish',
    'Inspire',
    'Nature',
    'Spirit',
    'Confidence',
    'History',
    'Illuminate',
    'Artificial',
  ],
  // https://wiki.linecorp.com/pages/viewpage.action?pageId=3773944622
  beta: [
    'Flourish',
    'Inspire',
    'Nature',
    'Spirit',
    'Confidence',
    'History',
    'Illuminate',
    'Artificial',
  ],
  prod: [
    'Flourish',
    'Inspire',
    'Nature',
    'Spirit',
    'Confidence',
    'History',
    'Illuminate',
    'Artificial',
  ],
}
