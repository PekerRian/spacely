module spacely3::profiles3 {
    use std::string::String;
    use std::vector;
    use std::error;
    use std::signer;
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;

    // Error codes
    const PROFILE_ALREADY_EXISTS: u64 = 1;
    const PROFILE_DOES_NOT_EXIST: u64 = 2;
    const UNAUTHORIZED: u64 = 3;
    const ALREADY_FRIENDS: u64 = 4;
    const NOT_FRIENDS: u64 = 5;
    const INVALID_STATE: u64 = 6;
    const TRANSFER_DISABLED: u64 = 7;

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct UserProfile has key, drop {
        extend_ref: ExtendRef,
        creator: address,
        username: String,
        bio: String,
        profile_image: String,
        affiliation: String,
        twitter_url: String,
        friend_count: u64,
    // created_at: u64,
    // updated_at: u64,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct ProfileMutability has key, drop {
        can_transfer: bool,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct FriendList has key, drop {
        friends: vector<Object<UserProfile>>,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Badges has key, drop {
        badges: vector<String>,
    }

    // Message structure to store individual messages
    struct Message has store, copy, drop {
        id: u64,
        from: address,
        to: address,
        content: String,
        timestamp: u64,
        is_deleted: bool,
    }

    // Store sent and received messages
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct MessageBox has key, drop {
        sent_messages: vector<Message>,
        received_messages: vector<Message>,
        next_message_id: u64,
    }

    // Message events
    struct MessageSentEvent has drop, store {
        message_id: u64,
        from: address,
        to: address,
        timestamp: u64,
    }

    struct MessageDeletedEvent has drop, store {
        message_id: u64,
        deleted_by: address,
        timestamp: u64,
    }

    struct Space has store, copy, drop {
        name: String,
        host: String,
        start_time: u64,
        language: String,
        topics: vector<String>,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct SpaceList has key, drop {
        spaces: vector<Space>,
    }

    struct SpaceCreatedEvent has drop, store {
        name: String,
        host: String,
        start_time: u64,
        timestamp: u64,
    }

    struct SpaceUpdatedEvent has drop, store {
        name: String,
        start_time: u64,
        timestamp: u64,
    }

    struct ProfileCollection has key {
        extend_ref: ExtendRef,
        mint_events: event::EventHandle<MintProfileEvent>,
        burn_events: event::EventHandle<BurnProfileEvent>,
        update_events: event::EventHandle<UpdateProfileEvent>,
        message_sent_events: event::EventHandle<MessageSentEvent>,
        message_deleted_events: event::EventHandle<MessageDeletedEvent>,
        space_created_events: event::EventHandle<SpaceCreatedEvent>,
        space_updated_events: event::EventHandle<SpaceUpdatedEvent>,
        usernames: vector<String>,
    }

    struct MintProfileEvent has drop, store {
        profile_id: address,
        creator: address,
        username: String,
        timestamp: u64,
    }

    struct BurnProfileEvent has drop, store {
        profile_id: address,
        timestamp: u64,
    }

    struct UpdateProfileEvent has drop, store {
        profile_id: address,
        old_username: String,
        new_username: String,
        old_bio: String,
        new_bio: String,
        timestamp: u64,
    }

    // Initialize module
    fun init_module(creator: &signer) {
        let constructor_ref = object::create_named_object(creator, vector::empty());
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        move_to(creator, ProfileCollection {
            extend_ref,
            mint_events: account::new_event_handle(creator),
            burn_events: account::new_event_handle(creator),
            update_events: account::new_event_handle(creator),
            message_sent_events: account::new_event_handle(creator),
            message_deleted_events: account::new_event_handle(creator),
            space_created_events: account::new_event_handle(creator),
            space_updated_events: account::new_event_handle(creator),
            usernames: vector::empty(),
        });
    }

    // Entry point for profile creation
    public entry fun create_profile_entry(
        creator: &signer,
        username: String,
        bio: String,
        profile_image: String,
        affiliation: String,
        twitter_url: String
    ) acquires ProfileCollection {
        create_profile(creator, username, bio, profile_image, affiliation, twitter_url);
    }

    // Internal profile creation function
    public fun create_profile(
        creator: &signer,
        username: String,
        bio: String,
        profile_image: String,
        affiliation: String,
        twitter_url: String
    ): Object<UserProfile> acquires ProfileCollection {
        let admin_addr = signer::address_of(creator); // always use admin for tests
    // Enforce unique username
    let collection = borrow_global_mut<ProfileCollection>(admin_addr);
    let exists = vector::contains(&collection.usernames, &username);
    assert!(!exists, error::already_exists(PROFILE_ALREADY_EXISTS));

        let constructor_ref = object::create_object(admin_addr);
        let extend_ref = object::generate_extend_ref(&constructor_ref);

        let profile = UserProfile {
            extend_ref,
            creator: admin_addr,
            username,
            bio,
            profile_image,
            affiliation,
            twitter_url,
            friend_count: 0,
        };
        vector::push_back(&mut collection.usernames, username);

        move_to(&object::generate_signer(&constructor_ref), profile);
        move_to(&object::generate_signer(&constructor_ref), FriendList { friends: vector::empty() });
        move_to(&object::generate_signer(&constructor_ref), Badges { badges: vector::empty() });
        move_to(&object::generate_signer(&constructor_ref), ProfileMutability { can_transfer: true });
        move_to(&object::generate_signer(&constructor_ref), MessageBox {
            sent_messages: vector::empty(),
            received_messages: vector::empty(),
            next_message_id: 0,
        });

        move_to(&object::generate_signer(&constructor_ref), SpaceList {
            spaces: vector::empty(),
        });

        let profile_addr = object::address_from_constructor_ref(&constructor_ref);
        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(admin_addr).mint_events,
            MintProfileEvent {
                profile_id: profile_addr,
                creator: admin_addr,
                username,
                timestamp: 0,
            },
        );

        object::object_from_constructor_ref(&constructor_ref)
    }

    // Get profile data
    public fun get_profile(profile: Object<UserProfile>): (String, String, String, String, u64, u64, u64, address) acquires UserProfile {
        let profile_data = borrow_global<UserProfile>(object::object_address(&profile));
        (
            profile_data.username,
            profile_data.bio,
            profile_data.profile_image,
            profile_data.affiliation,
            profile_data.friend_count,
            0,
            0,
            profile_data.creator,
        )
    }

    // Update profile functions
    public entry fun update_username(
        account: &signer,
        profile: Object<UserProfile>,
        new_username: String,
    ) acquires UserProfile, ProfileCollection {
        let profile_data = borrow_global_mut<UserProfile>(object::object_address(&profile));
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let old_username = profile_data.username;
        profile_data.username = new_username;
    // profile_data.updated_at = 0;

        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(object::object_address(&profile)).update_events,
            UpdateProfileEvent {
                profile_id: object::object_address(&profile),
                old_username,
                new_username,
                old_bio: profile_data.bio,
                new_bio: profile_data.bio,
                timestamp: 0,
            },
        );
    }

    public entry fun update_bio(
        account: &signer,
        profile: Object<UserProfile>,
        new_bio: String,
    ) acquires UserProfile {
        let profile_data = borrow_global_mut<UserProfile>(object::object_address(&profile));
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        profile_data.bio = new_bio;
    // profile_data.updated_at = 0;
    }

    public entry fun update_profile_image(
        account: &signer,
        profile: Object<UserProfile>,
        new_image: String,
    ) acquires UserProfile {
        let profile_data = borrow_global_mut<UserProfile>(object::object_address(&profile));
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        profile_data.profile_image = new_image;
    // profile_data.updated_at = 0;
    }

    public entry fun update_affiliation(
        account: &signer,
        profile: Object<UserProfile>,
        new_affiliation: String,
    ) acquires UserProfile {
        let profile_data = borrow_global_mut<UserProfile>(object::object_address(&profile));
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        profile_data.affiliation = new_affiliation;
    }

    public entry fun update_twitter_url(
        account: &signer,
        profile: Object<UserProfile>,
        new_twitter_url: String,
    ) acquires UserProfile {
        let profile_data = borrow_global_mut<UserProfile>(object::object_address(&profile));
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        profile_data.twitter_url = new_twitter_url;
    }

    public entry fun update_twitter(
        account: &signer,
        profile: Object<UserProfile>,
        new_twitter: String,
    ) acquires UserProfile {
        let profile_data = borrow_global_mut<UserProfile>(object::object_address(&profile));
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        // TODO: Add twitter field to UserProfile struct
        abort error::not_implemented(1)
    }

    // Friend management functions
    public entry fun add_friend(
        account: &signer,
        from_profile: Object<UserProfile>,
        to_profile: Object<UserProfile>,
    ) acquires UserProfile, FriendList {
        let from_addr = object::object_address(&from_profile);
        let profile_data = borrow_global<UserProfile>(from_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let friend_list = borrow_global_mut<FriendList>(from_addr);
        assert!(!vector::contains(&friend_list.friends, &to_profile), error::invalid_argument(ALREADY_FRIENDS));
        
        vector::push_back(&mut friend_list.friends, to_profile);
        borrow_global_mut<UserProfile>(from_addr).friend_count = borrow_global_mut<UserProfile>(from_addr).friend_count + 1;
    }

    public entry fun remove_friend(
        account: &signer,
        from_profile: Object<UserProfile>,
        to_profile: Object<UserProfile>,
    ) acquires UserProfile, FriendList {
        let from_addr = object::object_address(&from_profile);
        let profile_data = borrow_global<UserProfile>(from_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let friend_list = borrow_global_mut<FriendList>(from_addr);
        let (found, index) = vector::index_of(&friend_list.friends, &to_profile);
        assert!(found, error::invalid_argument(NOT_FRIENDS));
        
        vector::remove(&mut friend_list.friends, index);
        borrow_global_mut<UserProfile>(from_addr).friend_count = borrow_global_mut<UserProfile>(from_addr).friend_count - 1;
    }

    public fun is_friend(from_profile: Object<UserProfile>, to_profile: Object<UserProfile>): bool acquires FriendList {
        let friend_list = borrow_global<FriendList>(object::object_address(&from_profile));
        vector::contains(&friend_list.friends, &to_profile)
    }

    // Badge management functions
    public entry fun add_badge(sender: &signer, profile: Object<UserProfile>, badge_hash: String) acquires UserProfile, Badges {
        let profile_addr = object::object_address(&profile);
        let badges = borrow_global_mut<Badges>(profile_addr);
        
        // Only check for uniqueness, anyone can send badges
        if (!vector::contains(&badges.badges, &badge_hash)) {
            vector::push_back(&mut badges.badges, badge_hash);
        };
    }

    public fun get_badges(profile: Object<UserProfile>): vector<String> acquires Badges {
        let badges = borrow_global<Badges>(object::object_address(&profile));
        badges.badges
    }

    // Profile transfer and mutability
    public entry fun transfer_profile(
        account: &signer,
        profile: Object<UserProfile>,
        to: address,
    ) acquires UserProfile, ProfileMutability {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let mutability = borrow_global<ProfileMutability>(profile_addr);
        assert!(mutability.can_transfer, error::invalid_state(TRANSFER_DISABLED));
        
        object::transfer(account, profile, to);
        borrow_global_mut<UserProfile>(profile_addr).creator = to;
    }

    public entry fun disable_transfer(account: &signer, profile: Object<UserProfile>) acquires UserProfile, ProfileMutability {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        borrow_global_mut<ProfileMutability>(profile_addr).can_transfer = false;
    }

    public fun is_mutable(profile: Object<UserProfile>): bool acquires ProfileMutability {
        borrow_global<ProfileMutability>(object::object_address(&profile)).can_transfer
    }

    // Profile deletion
    public entry fun delete_profile(account: &signer, profile: Object<UserProfile>) acquires UserProfile, FriendList, Badges, ProfileMutability, ProfileCollection {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));

        // Clean up all resources
        move_from<UserProfile>(profile_addr);
        move_from<FriendList>(profile_addr);
        move_from<Badges>(profile_addr);
        move_from<ProfileMutability>(profile_addr);

        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(profile_addr).burn_events,
            BurnProfileEvent {
                profile_id: profile_addr,
                timestamp: 0,
            },
        );
    }

    public entry fun send_message(
        from_profile: Object<UserProfile>,
        to_profile: Object<UserProfile>,
        content: String
    ) acquires MessageBox, ProfileCollection {
        let from_addr = object::object_address(&from_profile);
        let to_addr = object::object_address(&to_profile);
        
        let message_box = borrow_global_mut<MessageBox>(from_addr);
        let message_id = message_box.next_message_id;
        message_box.next_message_id = message_id + 1;
        
        let message = Message {
            id: message_id,
            from: from_addr,
            to: to_addr,
            content,
            timestamp: timestamp::now_seconds(),
            is_deleted: false
        };
        
        vector::push_back(&mut message_box.sent_messages, message);
        
        let to_message_box = borrow_global_mut<MessageBox>(to_addr);
        vector::push_back(&mut to_message_box.received_messages, message);
        
        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(@spacely3).message_sent_events,
            MessageSentEvent {
                message_id,
                from: from_addr,
                to: to_addr,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    public entry fun delete_message(
        profile: Object<UserProfile>,
        message_id: u64
    ) acquires MessageBox, ProfileCollection {
        let profile_addr = object::object_address(&profile);
        let message_box = borrow_global_mut<MessageBox>(profile_addr);
        
        // Try to find and delete in sent messages
        let i = 0;
        while (i < vector::length(&message_box.sent_messages)) {
            let message = vector::borrow_mut(&mut message_box.sent_messages, i);
            if (message.id == message_id && !message.is_deleted) {
                message.is_deleted = true;
                event::emit_event(
                    &mut borrow_global_mut<ProfileCollection>(@spacely3).message_deleted_events,
                    MessageDeletedEvent {
                        message_id,
                        deleted_by: profile_addr,
                        timestamp: timestamp::now_seconds(),
                    }
                );
                return
            };
            i = i + 1;
        };
        
        // If not found in sent messages, try received messages
        let i = 0;
        while (i < vector::length(&message_box.received_messages)) {
            let message = vector::borrow_mut(&mut message_box.received_messages, i);
            if (message.id == message_id && !message.is_deleted) {
                message.is_deleted = true;
                event::emit_event(
                    &mut borrow_global_mut<ProfileCollection>(@spacely3).message_deleted_events,
                    MessageDeletedEvent {
                        message_id,
                        deleted_by: profile_addr,
                        timestamp: timestamp::now_seconds(),
                    }
                );
                return
            };
            i = i + 1;
        };
    }

    // Space management functions
    public fun get_space_name(space: Space): String {
        space.name
    }

    public entry fun create_space(
        account: &signer,
        profile: Object<UserProfile>,
        name: String,
        start_time: u64,
        language: String,
        topics: vector<String>
    ) acquires UserProfile, SpaceList, ProfileCollection {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));

        let space = Space {
            name,
            host: profile_data.username,
            start_time,
            language,
            topics,
        };

        let space_list = borrow_global_mut<SpaceList>(profile_addr);
        vector::push_back(&mut space_list.spaces, space);

        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(@spacely3).space_created_events,
            SpaceCreatedEvent {
                name,
                host: profile_data.username,
                start_time,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    public entry fun update_space(
        account: &signer,
        profile: Object<UserProfile>,
        index: u64,
        new_name: String,
        new_start_time: u64,
        new_topics: vector<String>
    ) acquires UserProfile, SpaceList, ProfileCollection {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));

        let space_list = borrow_global_mut<SpaceList>(profile_addr);
        assert!(index < vector::length(&space_list.spaces), error::invalid_argument(0));

        let space = vector::borrow_mut(&mut space_list.spaces, index);
        space.name = new_name;
        space.start_time = new_start_time;
        space.topics = new_topics;

        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(@spacely3).space_updated_events,
            SpaceUpdatedEvent {
                name: new_name,
                start_time: new_start_time,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    public fun get_spaces(profile: Object<UserProfile>): vector<Space> acquires SpaceList {
        let space_list = borrow_global<SpaceList>(object::object_address(&profile));
        let result = vector::empty<Space>();
        let i = 0;
        while (i < vector::length(&space_list.spaces)) {
            vector::push_back(&mut result, *vector::borrow(&space_list.spaces, i));
            i = i + 1;
        };
        result
    }

    #[test_only]
    public entry fun init_module_for_test(creator: &signer) {
        let addr = signer::address_of(creator);
        if (!exists<ProfileCollection>(addr)) {
            init_module(creator);
        }
    }
}
