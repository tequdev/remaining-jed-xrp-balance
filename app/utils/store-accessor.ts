import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import balance from '../store/balance'

// eslint-disable-next-line import/no-mutable-exports
let balances: balance

function initialiseStores(pStore: Store<any>): void {
  balances = getModule(balance, pStore)
}

export { initialiseStores, balances }
