import { Address, dataSource } from '@graphprotocol/graph-ts';
import { DelegateChanged, DelegateVotesChanged } from '../generated/Token/Token';
import { toDecimal, getDelegate, getGovernance, BIGINT_ZERO } from './helpers';
import { ContractDeployed } from "../generated/GeneralPurposeFactory/GeneralPurposeFactory";
import { GenericERC20Votes } from "../generated/templates";

const GENERIC_ERC20_VOTES_IMPLEM = Address.fromString('0x9814e1644919941adafc48ff3193ed1f76a2e3e1'); // Address on ethereum mainnet

export function handleDelegateChanged(event: DelegateChanged): void {
  let governanceId = dataSource.address();

  let previousDelegate = getDelegate(event.params.fromDelegate, governanceId);
  previousDelegate.tokenHoldersRepresentedAmount -= 1;
  previousDelegate.save();

  let newDelegate = getDelegate(event.params.toDelegate, governanceId);
  newDelegate.tokenHoldersRepresentedAmount += 1;
  newDelegate.save();
}

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  let governanceId = dataSource.address();

  let governance = getGovernance(governanceId);
  let delegate = getDelegate(event.params.delegate, governanceId);
  let votesDifference = event.params.newBalance.minus(event.params.previousBalance);

  delegate.delegatedVotesRaw = event.params.newBalance;
  delegate.delegatedVotes = toDecimal(event.params.newBalance);
  delegate.save();

  if (event.params.previousBalance == BIGINT_ZERO && event.params.newBalance > BIGINT_ZERO) {
    governance.currentDelegates += 1;
  }

  if (event.params.newBalance == BIGINT_ZERO) {
    governance.currentDelegates -= 1;
  }

  governance.delegatedVotesRaw = governance.delegatedVotesRaw.plus(votesDifference);
  governance.delegatedVotes = toDecimal(governance.delegatedVotesRaw);
  governance.save();
}

export function handleContractDeployed(event: ContractDeployed): void {
  if (event.params.implementation.equals(GENERIC_ERC20_VOTES_IMPLEM)) {
    GenericERC20Votes.create(event.params.contractAddress);
  }
}