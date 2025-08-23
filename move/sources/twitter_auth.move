module spacely::twitter_auth {
    use std::string::{String};
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};
    
    struct TwitterProfile has key {
        // Store Twitter profiles by account address
        profiles: Table<address, TwitterInfo>,
    }

    struct TwitterInfo has store, drop, copy {
        twitter_id: String,
        twitter_username: String,
        verified: bool,
    }

    public fun initialize(account: &signer) {
        move_to(account, TwitterProfile {
            profiles: table::new(),
        });
    }

    public entry fun link_twitter_account(
        account: &signer,
        twitter_id: String,
        twitter_username: String,
    ) acquires TwitterProfile {
        let signer_addr = account::get_address(account);
        let twitter_auth = borrow_global_mut<TwitterProfile>(@spacely);
        
        let twitter_info = TwitterInfo {
            twitter_id,
            twitter_username,
            verified: true,
        };
        
        table::upsert(&mut twitter_auth.profiles, signer_addr, twitter_info);
    }

    #[view]
    public fun get_twitter_info(user_addr: address): (String, String, bool) acquires TwitterProfile {
        let twitter_auth = borrow_global<TwitterProfile>(@spacely);
        
        if (table::contains(&twitter_auth.profiles, user_addr)) {
            let info = table::borrow(&twitter_auth.profiles, user_addr);
            (info.twitter_id, info.twitter_username, info.verified)
        } else {
            (string::utf8(b""), string::utf8(b""), false)
        }
    }
}
