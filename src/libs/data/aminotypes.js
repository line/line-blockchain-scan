/* eslint-disable  */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AminoTypes = void 0;
const amino_1 = require("@lbmjs/amino");
const encoding_1 = require("@cosmjs/encoding");
const utils_1 = require("@cosmjs/utils");
const gov_1 = require("lbmjs-types/lbm/gov/v1/gov");
const any_1 = require("lbmjs-types/google/protobuf/any");
const long_1 = __importDefault(require("long"));
function omitDefault(input) {
    if (typeof input === "string") {
        return input === "" ? undefined : input;
    }
    if (typeof input === "number") {
        return input === 0 ? undefined : input;
    }
    if (long_1.default.isLong(input)) {
        return input.isZero() ? undefined : input;
    }
    throw new Error(`Got unsupported type '${typeof input}'`);
}
function createDefaultTypes(prefix) {
    return {
        // bank
        "/lbm.bank.v1.MsgSend": {
            aminoType: "lbm-sdk/MsgSend",
            toAmino: ({ fromAddress, toAddress, amount }) => ({
                from_address: fromAddress,
                to_address: toAddress,
                amount: [...amount],
            }),
            fromAmino: ({ from_address, to_address, amount }) => ({
                fromAddress: from_address,
                toAddress: to_address,
                amount: [...amount],
            }),
        },
        "/lbm.bank.v1.MsgMultiSend": {
            aminoType: "lbm-sdk/MsgMultiSend",
            toAmino: ({ inputs, outputs }) => ({
                inputs: inputs.map((input) => ({
                    address: input.address,
                    coins: [...input.coins],
                })),
                outputs: outputs.map((output) => ({
                    address: output.address,
                    coins: [...output.coins],
                })),
            }),
            fromAmino: ({ inputs, outputs }) => ({
                inputs: inputs.map((input) => ({
                    address: input.address,
                    coins: [...input.coins],
                })),
                outputs: outputs.map((output) => ({
                    address: output.address,
                    coins: [...output.coins],
                })),
            }),
        },
        // distribution
        "/lbm.distribution.v1.MsgFundCommunityPool": {
            aminoType: "lbm-sdk/MsgFundCommunityPool",
            toAmino: ({ amount, depositor }) => ({
                amount: [...amount],
                depositor: depositor,
            }),
            fromAmino: ({ amount, depositor }) => ({
                amount: [...amount],
                depositor: depositor,
            }),
        },
        "/lbm.distribution.v1.MsgSetWithdrawAddress": {
            aminoType: "lbm-sdk/MsgModifyWithdrawAddress",
            toAmino: ({ delegatorAddress, withdrawAddress, }) => ({
                delegator_address: delegatorAddress,
                withdraw_address: withdrawAddress,
            }),
            fromAmino: ({ delegator_address, withdraw_address, }) => ({
                delegatorAddress: delegator_address,
                withdrawAddress: withdraw_address,
            }),
        },
        "/lbm.distribution.v1.MsgWithdrawDelegatorReward": {
            aminoType: "lbm-sdk/MsgWithdrawDelegationReward",
            toAmino: ({ delegatorAddress, validatorAddress, }) => ({
                delegator_address: delegatorAddress,
                validator_address: validatorAddress,
            }),
            fromAmino: ({ delegator_address, validator_address, }) => ({
                delegatorAddress: delegator_address,
                validatorAddress: validator_address,
            }),
        },
        "/lbm.distribution.v1.MsgWithdrawValidatorCommission": {
            aminoType: "lbm-sdk/MsgWithdrawValidatorCommission",
            toAmino: ({ validatorAddress, }) => ({
                validator_address: validatorAddress,
            }),
            fromAmino: ({ validator_address, }) => ({
                validatorAddress: validator_address,
            }),
        },
        // gov
        "/lbm.gov.v1.MsgDeposit": {
            aminoType: "lbm-sdk/MsgDeposit",
            toAmino: ({ amount, depositor, proposalId }) => {
                return {
                    amount,
                    depositor,
                    proposal_id: proposalId.toString(),
                };
            },
            fromAmino: ({ amount, depositor, proposal_id }) => {
                return {
                    amount: Array.from(amount),
                    depositor,
                    proposalId: long_1.default.fromString(proposal_id),
                };
            },
        },
        "/lbm.gov.v1.MsgVote": {
            aminoType: "lbm-sdk/MsgVote",
            toAmino: ({ option, proposalId, voter }) => {
                return {
                    option: option,
                    proposal_id: proposalId.toString(),
                    voter: voter,
                };
            },
            fromAmino: ({ option, proposal_id, voter }) => {
                return {
                    option: gov_1.voteOptionFromJSON(option),
                    proposalId: long_1.default.fromString(proposal_id),
                    voter: voter,
                };
            },
        },
        "/lbm.gov.v1.MsgSubmitProposal": {
            aminoType: "lbm-sdk/MsgSubmitProposal",
            toAmino: ({ initialDeposit, proposer, content, }) => {
                utils_1.assertDefinedAndNotNull(content);
                let proposal;
                switch (content.typeUrl) {
                    case "/lbm.gov.v1.TextProposal": {
                        const textProposal = gov_1.TextProposal.decode(content.value);
                        proposal = {
                            type: "lbm-sdk/TextProposal",
                            value: {
                                description: textProposal.description,
                                title: textProposal.title,
                            },
                        };
                        break;
                    }
                    default:
                        throw new Error(`Unsupported proposal type: '${content.typeUrl}'`);
                }
                return {
                    initial_deposit: initialDeposit,
                    proposer: proposer,
                    content: proposal,
                };
            },
            fromAmino: ({ initial_deposit, proposer, content, }) => {
                let any_content;
                switch (content.type) {
                    case "lbm-sdk/TextProposal": {
                        const { value } = content;
                        utils_1.assert(utils_1.isNonNullObject(value));
                        const { title, description } = value;
                        utils_1.assert(typeof title === "string");
                        utils_1.assert(typeof description === "string");
                        any_content = any_1.Any.fromPartial({
                            typeUrl: "/lbm.gov.v1.TextProposal",
                            value: gov_1.TextProposal.encode(gov_1.TextProposal.fromPartial({
                                title: title,
                                description: description,
                            })).finish(),
                        });
                        break;
                    }
                    default:
                        throw new Error(`Unsupported proposal type: '${content.type}'`);
                }
                return {
                    initialDeposit: Array.from(initial_deposit),
                    proposer: proposer,
                    content: any_content,
                };
            },
        },
        // staking
        "/lbm.staking.v1.MsgBeginRedelegate": {
            aminoType: "lbm-sdk/MsgBeginRedelegate",
            toAmino: ({ delegatorAddress, validatorSrcAddress, validatorDstAddress, amount, }) => {
                utils_1.assertDefinedAndNotNull(amount, "missing amount");
                return {
                    delegator_address: delegatorAddress,
                    validator_src_address: validatorSrcAddress,
                    validator_dst_address: validatorDstAddress,
                    amount: amount,
                };
            },
            fromAmino: ({ delegator_address, validator_src_address, validator_dst_address, amount, }) => ({
                delegatorAddress: delegator_address,
                validatorSrcAddress: validator_src_address,
                validatorDstAddress: validator_dst_address,
                amount: amount,
            }),
        },
        "/lbm.staking.v1.MsgCreateValidator": {
            aminoType: "lbm-sdk/MsgCreateValidator",
            toAmino: ({ description, commission, minSelfDelegation, delegatorAddress, validatorAddress, pubkey, value, }) => {
                utils_1.assertDefinedAndNotNull(description, "missing description");
                utils_1.assertDefinedAndNotNull(commission, "missing commission");
                utils_1.assertDefinedAndNotNull(pubkey, "missing pubkey");
                utils_1.assertDefinedAndNotNull(value, "missing value");
                return {
                    description: {
                        moniker: description.moniker,
                        identity: description.identity,
                        website: description.website,
                        security_contact: description.securityContact,
                        details: description.details,
                    },
                    commission: {
                        rate: commission.rate,
                        max_rate: commission.maxRate,
                        max_change_rate: commission.maxChangeRate,
                    },
                    min_self_delegation: minSelfDelegation,
                    delegator_address: delegatorAddress,
                    validator_address: validatorAddress,
                    pubkey: amino_1.encodeBech32Pubkey({
                        type: "ostracon/PubKeySecp256k1",
                        value: encoding_1.toBase64(pubkey.value),
                    }, prefix),
                    value: value,
                };
            },
            fromAmino: ({ description, commission, min_self_delegation, delegator_address, validator_address, pubkey, value, }) => {
                const decodedPubkey = amino_1.decodeBech32Pubkey(pubkey);
                if (decodedPubkey.type !== "ostracon/PubKeySecp256k1") {
                    throw new Error("Only Secp256k1 public keys are supported");
                }
                return {
                    description: {
                        moniker: description.moniker,
                        identity: description.identity,
                        website: description.website,
                        securityContact: description.security_contact,
                        details: description.details,
                    },
                    commission: {
                        rate: commission.rate,
                        maxRate: commission.max_rate,
                        maxChangeRate: commission.max_change_rate,
                    },
                    minSelfDelegation: min_self_delegation,
                    delegatorAddress: delegator_address,
                    validatorAddress: validator_address,
                    pubkey: {
                        typeUrl: "/lbm.crypto.secp256k1.PubKey",
                        value: encoding_1.fromBase64(decodedPubkey.value),
                    },
                    value: value,
                };
            },
        },
        "/lbm.staking.v1.MsgDelegate": {
            aminoType: "lbm-sdk/MsgDelegate",
            toAmino: ({ delegatorAddress, validatorAddress, amount }) => {
                utils_1.assertDefinedAndNotNull(amount, "missing amount");
                return {
                    delegator_address: delegatorAddress,
                    validator_address: validatorAddress,
                    amount: amount,
                };
            },
            fromAmino: ({ delegator_address, validator_address, amount, }) => ({
                delegatorAddress: delegator_address,
                validatorAddress: validator_address,
                amount: amount,
            }),
        },
        "/lbm.staking.v1.MsgEditValidator": {
            aminoType: "lbm-sdk/MsgEditValidator",
            toAmino: ({ description, commissionRate, minSelfDelegation, validatorAddress, }) => {
                utils_1.assertDefinedAndNotNull(description, "missing description");
                return {
                    description: {
                        moniker: description.moniker,
                        identity: description.identity,
                        website: description.website,
                        security_contact: description.securityContact,
                        details: description.details,
                    },
                    commission_rate: commissionRate,
                    min_self_delegation: minSelfDelegation,
                    validator_address: validatorAddress,
                };
            },
            fromAmino: ({ description, commission_rate, min_self_delegation, validator_address, }) => ({
                description: {
                    moniker: description.moniker,
                    identity: description.identity,
                    website: description.website,
                    securityContact: description.security_contact,
                    details: description.details,
                },
                commissionRate: commission_rate,
                minSelfDelegation: min_self_delegation,
                validatorAddress: validator_address,
            }),
        },
        "/lbm.staking.v1.MsgUndelegate": {
            aminoType: "lbm-sdk/MsgUndelegate",
            toAmino: ({ delegatorAddress, validatorAddress, amount, }) => {
                utils_1.assertDefinedAndNotNull(amount, "missing amount");
                return {
                    delegator_address: delegatorAddress,
                    validator_address: validatorAddress,
                    amount: amount,
                };
            },
            fromAmino: ({ delegator_address, validator_address, amount, }) => ({
                delegatorAddress: delegator_address,
                validatorAddress: validator_address,
                amount: amount,
            }),
        },
        // ibc
        "/ibc.applications.transfer.v1.MsgTransfer": {
            aminoType: "cosmos-sdk/MsgTransfer",
            toAmino: ({ sourcePort, sourceChannel, token, sender, receiver, timeoutHeight, timeoutTimestamp, }) => {
                var _a, _b, _c;
                return ({
                    source_port: sourcePort,
                    source_channel: sourceChannel,
                    token: token,
                    sender: sender,
                    receiver: receiver,
                    timeout_height: timeoutHeight
                        ? {
                            revision_height: (_a = omitDefault(timeoutHeight.revisionHeight)) === null || _a === void 0 ? void 0 : _a.toString(),
                            revision_number: (_b = omitDefault(timeoutHeight.revisionNumber)) === null || _b === void 0 ? void 0 : _b.toString(),
                        }
                        : {},
                    timeout_timestamp: (_c = omitDefault(timeoutTimestamp)) === null || _c === void 0 ? void 0 : _c.toString(),
                });
            },
            fromAmino: ({ source_port, source_channel, token, sender, receiver, timeout_height, timeout_timestamp, }) => ({
                sourcePort: source_port,
                sourceChannel: source_channel,
                token: token,
                sender: sender,
                receiver: receiver,
                timeoutHeight: timeout_height
                    ? {
                        revisionHeight: timeout_height.revision_height,
                        revisionNumber: timeout_height.revision_number,
                    }
                    : undefined,
                timeoutTimestamp: long_1.default.fromString(timeout_timestamp || "0", true),
            }),
        },
        // osmosis
        "/osmosis.gamm.v1beta1.MsgSwapExactAmountIn": {
            aminoType: "cosmos-sdk/MsgSwapExactAmountIn",
            toAmino: ({ sender, routes, tokenIn, tokenOutMinAmount}) => {
                utils_1.assertDefinedAndNotNull(tokenIn.amount, "missing amount");
                return {
                    sender,
                    routes: routes.map(({poolId, tokenOutDenom}) => ({pool_id: poolId, token_out_denom: tokenOutDenom})),
                    token_in: {
                      amount: tokenIn.amount,
                      denom: tokenIn.denom,
                    },
                    token_out_min_amount: tokenOutMinAmount,
                };
            },
            fromAmino: ({ sender, routes, token_in, token_out_min_amount }) => ({
                sender,
                routes: routes.map(({pool_id, token_out_denom})=>({poolId: long_1.default.fromString(pool_id), tokenOutDenom: token_out_denom})),
                tokenIn: {
                  amount: long_1.default.fromString(token_in.amount),
                  denom: token_in.denom,
                },
                tokenOutMinAmount: long_1.default.fromString(token_out_min_amount),
            }),
        },
    };
}
/**
 * A map from Stargate message types as used in the messages's `Any` type
 * to Amino types.
 */
class AminoTypes {
    constructor({ additions = {}, prefix = "link" } = {}) {
        const additionalAminoTypes = Object.values(additions);
        const filteredDefaultTypes = Object.entries(createDefaultTypes(prefix)).reduce((acc, [key, value]) => additionalAminoTypes.find(({ aminoType }) => value.aminoType === aminoType)
            ? acc
            : Object.assign(Object.assign({}, acc), { [key]: value }), {});
        this.register = Object.assign(Object.assign({}, filteredDefaultTypes), additions);
    }
    toAmino({ typeUrl, value }) {
        console.log('typeurl:', typeUrl, value)
        const converter = this.register[typeUrl];
        if (!converter) {
            throw new Error("Type URL does not exist in the Amino message type register. " +
                "If you need support for this message type, you can pass in additional entries to the AminoTypes constructor. " +
                "If you think this message type should be included by default, please open an issue at https://github.com/cosmos/cosmjs/issues.");
        }
        return {
            type: converter.aminoType,
            value: converter.toAmino(value),
        };
    }
    fromAmino({ type, value }) {
        const result = Object.entries(this.register).find(([_typeUrl, { aminoType }]) => aminoType === type);
        if (!result) {
            throw new Error("Type does not exist in the Amino message type register. " +
                "If you need support for this message type, you can pass in additional entries to the AminoTypes constructor. " +
                "If you think this message type should be included by default, please open an issue at https://github.com/cosmos/cosmjs/issues.");
        }
        const [typeUrl, converter] = result;
        return {
            typeUrl: typeUrl,
            value: converter.fromAmino(value),
        };
    }
}
exports.AminoTypes = AminoTypes;
//# sourceMappingURL=aminotypes.js.map
