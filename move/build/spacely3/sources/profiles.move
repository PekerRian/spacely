module spacely3::profiles {
    use std::string::String;
    use std::vector;
    use std::error;
    use std::signer;
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use std::table::{Self, Table};

    // Error codes
    const PROFILE_ALREADY_EXISTS: u64 = 1;
    const PROFILE_DOES_NOT_EXIST: u64 = 2;
    const UNAUTHORIZED: u64 = 3;
    const ALREADY_FRIENDS: u64 = 4;
    const NOT_FRIENDS: u64 = 5;
    const INVALID_STATE: u64 = 6;
    const TRANSFER_DISABLED: u64 = 7;
    const INVALID_RECURRING_INTERVAL: u64 = 65551;
    const CAPABILITY_NOT_FOUND: u64 = 8;

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct ProfileCapability has key, store {
        can_update_profile: bool,
        can_manage_friends: bool,
        can_manage_spaces: bool,
        can_send_messages: bool,
    }

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
        created_at: u64,
        updated_at: u64,
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

    const SPACE_STATUS_SCHEDULED: u8 = 0;
    const SPACE_STATUS_ACTIVE: u8 = 1;
    const SPACE_STATUS_COMPLETED: u8 = 2;
    const SPACE_STATUS_CANCELLED: u8 = 3;

    const CATEGORY_GENERAL: u8 = 0;
    const CATEGORY_TECHNICAL: u8 = 1;
    const CATEGORY_SOCIAL: u8 = 2;
    const CATEGORY_EDUCATION: u8 = 3;
    const CATEGORY_GAMING: u8 = 4;

    const SCHEDULING_CONFLICT: u64 = 8;
    const INVALID_TIME: u64 = 9;
    const INVALID_STATUS: u64 = 10;
    const INVALID_CATEGORY: u64 = 11;
    const NOT_HOST: u64 = 12;
    const NOT_PARTICIPANT: u64 = 13;
    const ALREADY_PARTICIPANT: u64 = 14;

    const MAX_RECURRING_INTERVAL: u64 = 90; // Maximum 90 days between recurring spaces
    const MIN_RECURRING_INTERVAL: u64 = 1;  // Minimum 1 day between recurring spaces
    const DAY_IN_SECONDS: u64 = 86400; // Number of seconds in a day

    struct Space has store, copy, drop {
        id: u64,
        name: String,
        host: String,
        start_time: u64,
        duration: u64,   // Duration in minutes
        language: String,
        topics: vector<String>,
        category: u8,
        status: u8,
        max_participants: u64,
        participant_count: u64,
        description: String,
        is_recurring: bool,
        recurring_interval: u64,  // Interval in days between recurring sessions (0 if not recurring)
        parent_space_id: u64      // ID of the original space if this is a recurring instance (0 if original or not recurring)
    }

    struct SpaceParticipant has store, copy, drop {
        profile_id: address,
        joined_at: u64
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct ParticipantList has key, store, drop {
        participants: vector<SpaceParticipant>
    }

    struct SpaceList has key {
        spaces: Table<u64, Space>,
        space_ids: vector<u64>,
        next_space_id: u64,
        participants: Table<u64, ParticipantList>  // Maps space_id to its participants
    }

    // Global space directory for discovery
    struct SpaceDirectory has key {
        spaces: Table<u64, address>,  // Maps space ID to profile address
        categories: vector<vector<u64>>, // Space IDs grouped by category
        upcoming_spaces: vector<u64>   // IDs of spaces that haven't started yet
    }

    #[event]
    struct SpaceCreatedEvent has drop, store {
        profile_addr: address,
        space_id: u64,
        space: Space,
    }

    #[event]
    struct SpaceUpdatedEvent has drop, store {
        profile_addr: address,
        space_id: u64,
        name: String,
        start_time: u64,
        topics: vector<String>,
        timestamp: u64
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
    ) acquires ProfileCollection, SpaceDirectory {
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
    ): Object<UserProfile> acquires ProfileCollection, SpaceDirectory {
        let admin_addr = signer::address_of(creator); // always use admin for tests
        // Enforce unique username
        let collection = borrow_global_mut<ProfileCollection>(admin_addr);
        let username_exists = vector::contains(&collection.usernames, &username);
        assert!(!username_exists, error::already_exists(PROFILE_ALREADY_EXISTS));

        let constructor_ref = object::create_object(admin_addr);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let now = timestamp::now_seconds();

        let profile = UserProfile {
            extend_ref,
            creator: admin_addr,
            username,
            bio,
            profile_image,
            affiliation,
            twitter_url,
            friend_count: 0,
            created_at: now,
            updated_at: now,
        };
        vector::push_back(&mut collection.usernames, username);

        move_to(&object::generate_signer(&constructor_ref), profile);
        move_to(&object::generate_signer(&constructor_ref), FriendList { friends: vector::empty() });
        move_to(&object::generate_signer(&constructor_ref), Badges { badges: vector::empty() });
        move_to(&object::generate_signer(&constructor_ref), ProfileMutability { can_transfer: true });
        move_to(&object::generate_signer(&constructor_ref), ProfileCapability {
            can_update_profile: true,
            can_manage_friends: true,
            can_manage_spaces: true,
            can_send_messages: true,
        });
        move_to(&object::generate_signer(&constructor_ref), MessageBox {
            sent_messages: vector::empty(),
            received_messages: vector::empty(),
            next_message_id: 0,
        });

        move_to(&object::generate_signer(&constructor_ref), SpaceList {
            spaces: table::new(),
            space_ids: vector::empty(),
            next_space_id: 0,
            participants: table::new()
        });

        // Initialize space directory if it doesn't exist
        if (!exists<SpaceDirectory>(@spacely3)) {
            move_to(creator, SpaceDirectory {
                spaces: table::new(),
                categories: vector::empty(),
                upcoming_spaces: vector::empty()
            });
            // Initialize category vectors
            let directory = borrow_global_mut<SpaceDirectory>(@spacely3);
            let i = 0;
            while (i <= CATEGORY_GAMING) {
                vector::push_back(&mut directory.categories, vector::empty());
                i = i + 1;
            };
        };

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
    ) acquires UserProfile, ProfileCollection, ProfileCapability {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global_mut<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        assert!(check_capability(profile, 1), error::permission_denied(CAPABILITY_NOT_FOUND));
        
        let now = timestamp::now_seconds();
        profile_data.updated_at = now;        let old_username = profile_data.username;
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
        _new_twitter: String,
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
    public entry fun add_badge(_sender: &signer, profile: Object<UserProfile>, badge_hash: String) acquires Badges {
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

    fun check_capability(profile: Object<UserProfile>, capability_type: u8): bool acquires ProfileCapability {
        let cap = borrow_global<ProfileCapability>(object::object_address(&profile));
        if (capability_type == 1) {
            cap.can_update_profile
        } else if (capability_type == 2) {
            cap.can_manage_friends
        } else if (capability_type == 3) {
            cap.can_manage_spaces
        } else if (capability_type == 4) {
            cap.can_send_messages
        } else {
            false
        }
    }

    public fun has_update_capability(profile: Object<UserProfile>): bool acquires ProfileCapability {
        check_capability(profile, 1)
    }

    public fun has_friend_capability(profile: Object<UserProfile>): bool acquires ProfileCapability {
        check_capability(profile, 2)
    }

    public fun has_space_capability(profile: Object<UserProfile>): bool acquires ProfileCapability {
        check_capability(profile, 3)
    }

    public fun has_message_capability(profile: Object<UserProfile>): bool acquires ProfileCapability {
        check_capability(profile, 4)
    }

    public entry fun set_profile_capability(
        account: &signer,
        profile: Object<UserProfile>,
        can_update_profile: bool,
        can_manage_friends: bool,
        can_manage_spaces: bool,
        can_send_messages: bool
    ) acquires UserProfile, ProfileCapability {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let cap = borrow_global_mut<ProfileCapability>(profile_addr);
        cap.can_update_profile = can_update_profile;
        cap.can_manage_friends = can_manage_friends;
        cap.can_manage_spaces = can_manage_spaces;
        cap.can_send_messages = can_send_messages;
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

    public entry fun cancel_space(
        account: &signer,
        profile: Object<UserProfile>,
        space_id: u64
    ) acquires UserProfile, SpaceList, SpaceDirectory {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let space_list = borrow_global_mut<SpaceList>(profile_addr);
        assert!(table::contains(&space_list.spaces, space_id), error::invalid_argument(0));
        
        // Can only cancel active or scheduled spaces
        let space = table::borrow_mut(&mut space_list.spaces, space_id);
        assert!(
            space.status == SPACE_STATUS_SCHEDULED || space.status == SPACE_STATUS_ACTIVE,
            error::invalid_state(INVALID_STATUS)
        );
        space.status = SPACE_STATUS_CANCELLED;

        // Remove from upcoming spaces if present
        let directory = borrow_global_mut<SpaceDirectory>(@spacely3);
        let (found, index) = vector::index_of(&directory.upcoming_spaces, &space_id);
        if (found) {
            vector::remove(&mut directory.upcoming_spaces, index);
        };
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

    // Accessors for Space fields (tests can't access struct fields directly)
    public fun is_space_recurring(space: Space): bool {
        space.is_recurring
    }

    public fun space_recurring_interval(space: Space): u64 {
        space.recurring_interval
    }

    public fun space_parent_space_id(space: Space): u64 {
        space.parent_space_id
    }

    public fun space_start_time(space: Space): u64 {
        space.start_time
    }

    public fun space_duration(space: Space): u64 {
        space.duration
    }

    public fun space_max_participants(space: Space): u64 {
        space.max_participants
    }

    // Check for scheduling conflicts
    fun check_scheduling_conflict(profile_addr: address, start_time: u64, duration: u64) acquires SpaceList {
        let space_list = borrow_global<SpaceList>(profile_addr);
        let end_time = start_time + duration;
        
        let i = 0;
        let len = vector::length(&space_list.space_ids);
        while (i < len) {
            let space_id = *vector::borrow(&space_list.space_ids, i);
            let space = table::borrow(&space_list.spaces, space_id);
            if (space.status == SPACE_STATUS_SCHEDULED || space.status == SPACE_STATUS_ACTIVE) {
                let space_end = space.start_time + space.duration;
                assert!(
                    end_time <= space.start_time || start_time >= space_end,
                    error::invalid_state(SCHEDULING_CONFLICT)
                );
            };
            i = i + 1;
        };
    }

    /// Gets all recurring child instances for a profile (excludes the original parent)
    public fun get_recurring_spaces(profile: Object<UserProfile>) : vector<Space> acquires SpaceList {
        let profile_addr = object::object_address(&profile);
        let space_list = borrow_global<SpaceList>(profile_addr);
        let recurring_spaces = vector::empty<Space>();
        let i = 0;
        let len = vector::length(&space_list.space_ids);

        while (i < len) {
            let space_id = *vector::borrow(&space_list.space_ids, i);
            let space = table::borrow(&space_list.spaces, space_id);
            // Include all recurring spaces (both parent and child)
            if (space.is_recurring && space.status != SPACE_STATUS_CANCELLED) {
                vector::push_back(&mut recurring_spaces, *space);
            };
            i = i + 1;
        };

        recurring_spaces
    }

    /// Creates the next occurrence of a recurring space
    fun create_next_occurrence(
        _account: &signer,
        profile: Object<UserProfile>,
        parent_space_id: u64,
        space_id: u64
    ) acquires SpaceList, SpaceDirectory, ProfileCollection {
        // Borrow the parent space immutably first to compute next occurrence
        let profile_addr = object::object_address(&profile);
        let parent_space_ref = table::borrow(&borrow_global<SpaceList>(profile_addr).spaces, parent_space_id);
        let next_start_time = parent_space_ref.start_time + (parent_space_ref.recurring_interval * DAY_IN_SECONDS);

        let space = Space {
            id: space_id,
            name: parent_space_ref.name,
            host: parent_space_ref.host,
            start_time: next_start_time,
            duration: parent_space_ref.duration,
            language: parent_space_ref.language,
            topics: parent_space_ref.topics,
            category: parent_space_ref.category,
            status: SPACE_STATUS_SCHEDULED,
            max_participants: parent_space_ref.max_participants,
            participant_count: 0,
            description: parent_space_ref.description,
            is_recurring: parent_space_ref.is_recurring,
            recurring_interval: parent_space_ref.recurring_interval,
            parent_space_id: parent_space_id
        };

        // Now mutably add the new space
        let space_list = borrow_global_mut<SpaceList>(profile_addr);
        table::add(&mut space_list.spaces, space_id, space);
        vector::push_back(&mut space_list.space_ids, space_id);

        // Add to global directory
        let space_directory = borrow_global_mut<SpaceDirectory>(@spacely3);
        table::add(&mut space_directory.spaces, space_id, profile_addr);

        // Emit event (use global ProfileCollection event handle)
        let tmp_ref = table::borrow(&space_list.spaces, space_id);
        let created_space = *tmp_ref;
        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(@spacely3).space_created_events,
            SpaceCreatedEvent {
                profile_addr,
                space_id,
                space: created_space,
            }
        );
    }

    public entry fun create_space(
        account: &signer,
        profile: Object<UserProfile>,
        name: String,
        start_time: u64,
        duration: u64,
        language: String,
        topics: vector<String>,
        category: u8,
        max_participants: u64,
        description: String,
        is_recurring: bool,
        recurring_interval: u64
    ) acquires UserProfile, SpaceList, ProfileCollection, SpaceDirectory {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        // Validate inputs
        assert!(start_time > timestamp::now_seconds(), error::invalid_argument(INVALID_TIME));
        assert!(category <= CATEGORY_GAMING, error::invalid_argument(INVALID_CATEGORY));
        
        // Validate recurring parameters
        if (is_recurring) {
            assert!(
                recurring_interval >= MIN_RECURRING_INTERVAL && recurring_interval <= MAX_RECURRING_INTERVAL,
                65551
            );
        } else {
            assert!(recurring_interval == 0, error::invalid_argument(INVALID_RECURRING_INTERVAL));
        };
        
        // Check for scheduling conflicts
        check_scheduling_conflict(profile_addr, start_time, duration);

        // Reserve ids while holding a short-lived mutable borrow
        let space_id: u64;
        let next_child_id: u64;
        {
            let tmp_sl = borrow_global_mut<SpaceList>(profile_addr);
            space_id = tmp_sl.next_space_id;
            tmp_sl.next_space_id = space_id + 1;
            next_child_id = tmp_sl.next_space_id;
        };

        let space = Space {
            id: space_id,
            name,
            host: profile_data.username,
            start_time,
            duration,
            language,
            topics,
            category,
            status: SPACE_STATUS_SCHEDULED,
            max_participants,
            participant_count: 0,
            description,
            is_recurring,
            recurring_interval,
            parent_space_id: 0
        };

        // Add parent space to profile in a short-lived mutable borrow so we can call other functions later
        {
            let sl = borrow_global_mut<SpaceList>(profile_addr);
            table::add(&mut sl.spaces, space_id, space);
            vector::push_back(&mut sl.space_ids, space_id);
        };

        // If recurring, create the next occurrence (child) using the reserved child id
        if (is_recurring) {
            create_next_occurrence(
                account,
                profile,
                space_id,
                next_child_id
            );
        };

        // Add to global directory
        let space_directory = borrow_global_mut<SpaceDirectory>(@spacely3);
        table::add(&mut space_directory.spaces, space_id, profile_addr);
        vector::push_back(&mut space_directory.upcoming_spaces, space_id);

        // Emit event for the created parent space
        let created_space_ref = table::borrow(&borrow_global<SpaceList>(profile_addr).spaces, space_id);
        let created_space = *created_space_ref;
        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(@spacely3).space_created_events,
            SpaceCreatedEvent {
                profile_addr,
                space_id,
                space: created_space
            }
        );
    }

    public entry fun update_space(
        account: &signer,
        profile: Object<UserProfile>,
        space_id: u64,
        new_name: String,
        new_start_time: u64,
        new_topics: vector<String>
    ) acquires UserProfile, SpaceList, ProfileCollection {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));

        let space_list = borrow_global_mut<SpaceList>(profile_addr);
        assert!(table::contains(&space_list.spaces, space_id), error::invalid_argument(0));

        let space = table::borrow_mut(&mut space_list.spaces, space_id);
        space.name = new_name;
        space.start_time = new_start_time;
        space.topics = new_topics;

        event::emit_event(
            &mut borrow_global_mut<ProfileCollection>(@spacely3).space_updated_events,
            SpaceUpdatedEvent {
                profile_addr,
                space_id,
                name: new_name,
                start_time: new_start_time,
                topics: new_topics,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    public fun get_spaces(profile: Object<UserProfile>): vector<Space> acquires SpaceList {
        let space_list = borrow_global<SpaceList>(object::object_address(&profile));
        let result = vector::empty<Space>();
        let i = 0;
        let len = vector::length(&space_list.space_ids);
        
        while (i < len) {
            let space_id = *vector::borrow(&space_list.space_ids, i);
            let tmp_ref = table::borrow(&space_list.spaces, space_id);
            vector::push_back(&mut result, *tmp_ref);
            i = i + 1;
        };
        result
    }

    // Space participation management
    public entry fun leave_space(
        account: &signer,
        host_profile: Object<UserProfile>,
        space_id: u64
    ) acquires SpaceList {
        let host_addr = object::object_address(&host_profile);
        let space_list = borrow_global_mut<SpaceList>(host_addr);
        
        assert!(table::contains(&space_list.spaces, space_id), error::invalid_argument(0));
        let space = table::borrow_mut(&mut space_list.spaces, space_id);
        
        // Validate space state
        assert!(space.status == SPACE_STATUS_SCHEDULED, error::invalid_state(INVALID_STATUS));
        assert!(table::contains(&space_list.participants, space_id), error::invalid_state(NOT_PARTICIPANT));
        
        // Find and remove participant
        let participant_list = table::borrow_mut(&mut space_list.participants, space_id);
        let leaver_addr = signer::address_of(account);
        let i = 0;
        let found = false;
        while (i < vector::length(&participant_list.participants)) {
            if (vector::borrow(&participant_list.participants, i).profile_id == leaver_addr) {
                vector::remove(&mut participant_list.participants, i);
                found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(found, error::invalid_state(NOT_PARTICIPANT));
        
        // Update participant count in space
        let space = table::borrow_mut(&mut space_list.spaces, space_id);
        space.participant_count = space.participant_count - 1;
    }

    public entry fun update_space_status(
        account: &signer,
        profile: Object<UserProfile>,
        space_id: u64,
        new_status: u8
    ) acquires UserProfile, SpaceList {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let space_list = borrow_global_mut<SpaceList>(profile_addr);
        assert!(table::contains(&space_list.spaces, space_id), error::invalid_argument(0));
        
        let space = table::borrow_mut(&mut space_list.spaces, space_id);
        assert!(new_status <= SPACE_STATUS_CANCELLED, error::invalid_argument(INVALID_STATUS));
        
        // Validate status transitions
        if (new_status == SPACE_STATUS_ACTIVE) {
            assert!(space.status == SPACE_STATUS_SCHEDULED, error::invalid_state(INVALID_STATUS));
        } else if (new_status == SPACE_STATUS_COMPLETED) {
            assert!(space.status == SPACE_STATUS_ACTIVE, error::invalid_state(INVALID_STATUS));
        };
        
        space.status = new_status;
    }

    public entry fun delete_space(
        account: &signer,
        profile: Object<UserProfile>,
        space_id: u64
    ) acquires UserProfile, SpaceList {
        let profile_addr = object::object_address(&profile);
        let profile_data = borrow_global<UserProfile>(profile_addr);
        assert!(signer::address_of(account) == profile_data.creator, error::permission_denied(UNAUTHORIZED));
        
        let space_list = borrow_global_mut<SpaceList>(profile_addr);
        assert!(table::contains(&space_list.spaces, space_id), error::invalid_argument(0));
        
        // Can only delete cancelled or completed spaces
        let space = table::borrow(&space_list.spaces, space_id);
        assert!(
            space.status == SPACE_STATUS_CANCELLED || space.status == SPACE_STATUS_COMPLETED,
            error::invalid_state(INVALID_STATUS)
        );
        
        // Remove from space list first to prevent future access
        let (found, index) = vector::index_of(&space_list.space_ids, &space_id);
        if (found) {
            vector::remove(&mut space_list.space_ids, index);
        };
        
        // Remove space and participant list
        table::remove(&mut space_list.spaces, space_id);
        if (table::contains(&space_list.participants, space_id)) {
            table::remove(&mut space_list.participants, space_id);
        };
    }

    // Space discovery
    public fun get_upcoming_spaces(): vector<u64> acquires SpaceDirectory {
        let directory = borrow_global<SpaceDirectory>(@spacely3);
        directory.upcoming_spaces
    }

    public fun get_spaces_by_category(category: u8): vector<u64> acquires SpaceDirectory {
        assert!(category <= CATEGORY_GAMING, error::invalid_argument(INVALID_CATEGORY));
        
        let directory = borrow_global<SpaceDirectory>(@spacely3);
        
        let len = (vector::length(&directory.categories) as u8);
        if (category < len) {
            *vector::borrow(&directory.categories, (category as u64))
        } else {
            vector::empty<u64>()
        }
    }

    #[test_only]
    public entry fun init_module_for_test(creator: &signer) {
        let addr = signer::address_of(creator);
        if (!exists<ProfileCollection>(addr)) {
            init_module(creator);
        }
    }
}
