#[test_only]
module spacely1::spacelyapp_tests {
    use std::string::{String, Self};
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use spacely1::spacelyapp;

    // Test constants
    const USERNAME: vector<u8> = b"testuser";
    const PROFILE_IMG: vector<u8> = b"https://example.com/img.jpg";
    const AFFILIATION: vector<u8> = b"Test Org";
    const BIO: vector<u8> = b"Test bio";
    const TWITTER_URL: vector<u8> = b"https://twitter.com/testuser";
    const TEST_MESSAGE: vector<u8> = b"Hello, this is a test message!";
    const BADGE_HASH: vector<u8> = b"badge123";

    fun setup(admin: &signer, framework: &signer) {
        // Set up timestamp for testing
        timestamp::set_time_has_started_for_testing(framework);
        // Initialize the module
        spacelyapp::init_module_for_test(admin);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_profile_creation(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Verify profile data
        let (name, bio, img, affil, friend_count, _, _, addr) = spacelyapp::get_profile(profile);
        assert!(string::bytes(&name) == &USERNAME, 1);
        assert!(string::bytes(&bio) == &BIO, 2);
        assert!(string::bytes(&img) == &PROFILE_IMG, 3);
        assert!(string::bytes(&affil) == &AFFILIATION, 4);
        assert!(friend_count == 0, 5);
        assert!(addr == signer::address_of(admin), 6);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_update_profile(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Update profile
        let new_bio = string::utf8(b"Updated bio");
        let new_img = string::utf8(b"new_img.jpg");
        let new_affil = string::utf8(b"New Org");

        spacelyapp::update_bio(admin, profile, new_bio);
        spacelyapp::update_profile_image(admin, profile, new_img);
        spacelyapp::update_affiliation(admin, profile, new_affil);

        // Verify updates
        let (_, bio, img, affil, _, _, _, _) = spacelyapp::get_profile(profile);
        assert!(string::bytes(&bio) == string::bytes(&new_bio), 1);
        assert!(string::bytes(&img) == string::bytes(&new_img), 2);
        assert!(string::bytes(&affil) == string::bytes(&new_affil), 3);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_friend_operations(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile1 = spacelyapp::create_profile(
            admin,
            string::utf8(b"user1"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user1")
        );

        let profile2 = spacelyapp::create_profile(
            admin,
            string::utf8(b"user2"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user2")
        );

        // Add friend
        spacelyapp::add_friend(admin, profile1, profile2);
        assert!(spacelyapp::is_friend(profile1, profile2), 1);

        // Remove friend
        spacelyapp::remove_friend(admin, profile1, profile2);
        assert!(!spacelyapp::is_friend(profile1, profile2), 2);
    }

    #[test(admin = @spacely1, other_user = @0x123, framework = @aptos_framework)]
    public fun test_badge_operations(admin: &signer, other_user: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Test that admin can add badge
        let badge1 = string::utf8(BADGE_HASH);
        spacelyapp::add_badge(admin, profile, badge1);

        let badges = spacelyapp::get_badges(profile);
        assert!(vector::contains(&badges, &badge1), 1);

        // Test that another user can also add badge
        let badge2 = string::utf8(b"another_badge");
        spacelyapp::add_badge(other_user, profile, badge2);

        let badges = spacelyapp::get_badges(profile);
        assert!(vector::contains(&badges, &badge2), 2);

        // Test that duplicate badges aren't added
        spacelyapp::add_badge(other_user, profile, badge2);
        let badges = spacelyapp::get_badges(profile);
        assert!(vector::length(&badges) == 2, 3); // Still only 2 badges
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_messaging(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile1 = spacelyapp::create_profile(
            admin,
            string::utf8(b"user1"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user1")
        );

        let profile2 = spacelyapp::create_profile(
            admin,
            string::utf8(b"user2"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"https://twitter.com/user2")
        );

        spacelyapp::send_message(profile1, profile2, string::utf8(TEST_MESSAGE));

        // Delete message
        spacelyapp::delete_message(profile1, 0);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_recurring_space_creation(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Set current timestamp
        timestamp::update_global_time_for_test(1000000);
        let start_time = timestamp::now_seconds() + 3600; // Start in 1 hour
        
        let topics = vector::empty<String>();
        vector::push_back(&mut topics, string::utf8(b"Move"));
        vector::push_back(&mut topics, string::utf8(b"Blockchain"));

        // Create a recurring space
        spacelyapp::create_space(
            admin,
            profile,
            string::utf8(b"Weekly Move Workshop"),
            start_time,
            3600, // 1 hour duration
            string::utf8(b"English"),
            topics,
            0, // category
            10, // max participants
            string::utf8(b"Weekly workshop about Move language"),
            true, // is_recurring
            7 // recurring_interval (weekly)
        );

        // Get all spaces and verify
        let spaces = spacelyapp::get_spaces(profile);
        assert!(vector::length(&spaces) == 2, 1); // Original space + first recurring instance

        // Get recurring spaces specifically
        let recurring_spaces = spacelyapp::get_recurring_spaces(profile);
        assert!(vector::length(&recurring_spaces) == 2, 2); // Parent space + child space

        let recurring_space = vector::borrow(&recurring_spaces, 0);
    assert!(spacelyapp::is_space_recurring(*recurring_space) == true, 3);
    assert!(spacelyapp::space_recurring_interval(*recurring_space) == 7, 4);
    assert!(spacelyapp::space_parent_space_id(*recurring_space) == 0, 5);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
        #[expected_failure(abort_code = spacelyapp::INVALID_RECURRING_INTERVAL, location = spacely1::spacelyapp)]
    public fun test_invalid_recurring_interval(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Set current timestamp
        timestamp::update_global_time_for_test(1000000);
        let start_time = timestamp::now_seconds() + 3600;
        
        let topics = vector::empty<String>();
        vector::push_back(&mut topics, string::utf8(b"Move"));

        // Try to create a space with invalid recurring interval (91 days, max is 90)
        spacelyapp::create_space(
            admin,
            profile,
            string::utf8(b"Invalid Recurring Space"),
            start_time,
            3600,
            string::utf8(b"English"),
            topics,
            0,
            10,
            string::utf8(b"This should fail"),
            true,
            91
        );
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_recurring_space_next_occurrence(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Set current timestamp
        timestamp::update_global_time_for_test(1000000);
        let start_time = timestamp::now_seconds() + 3600;
        
        let topics = vector::empty<String>();
        vector::push_back(&mut topics, string::utf8(b"Move"));

        // Create a daily recurring space
        spacelyapp::create_space(
            admin,
            profile,
            string::utf8(b"Daily Move Standup"),
            start_time,
            1800, // 30 minutes duration
            string::utf8(b"English"),
            topics,
            0,
            5,
            string::utf8(b"Daily standup meeting"),
            true,
            1 // daily
        );

        // Get all spaces
        let spaces = spacelyapp::get_spaces(profile);
        assert!(vector::length(&spaces) == 2, 1); // Original + first recurring

        // Verify the recurring instance
        let second_space = vector::borrow(&spaces, 1);
    assert!(spacelyapp::space_parent_space_id(*second_space) == 0, 2); // Points to first space
    assert!(spacelyapp::space_start_time(*second_space) == start_time + 86400, 3); // Next day
    assert!(spacelyapp::space_duration(*second_space) == 1800, 4); // Same duration
    assert!(spacelyapp::space_max_participants(*second_space) == 5, 5); // Same max participants
    assert!(spacelyapp::is_space_recurring(*second_space) == true, 6); // Still recurring
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_transfer_and_mutability(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Verify initial mutability
        assert!(spacelyapp::is_mutable(profile), 1);

        // Disable transfers
        spacelyapp::disable_transfer(admin, profile);
        assert!(!spacelyapp::is_mutable(profile), 2);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_twitter_url_update(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Update twitter URL
        let new_twitter_url = string::utf8(b"https://twitter.com/newhandle");
        spacelyapp::update_twitter_url(admin, profile, new_twitter_url);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    #[expected_failure(abort_code = 0x80001, location = spacely1::spacelyapp)] // error::already_exists(PROFILE_ALREADY_EXISTS)
    public fun test_duplicate_username(admin: &signer, framework: &signer) {
        setup(admin, framework);
        
        // Create first profile
        spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Try to create second profile with same username (should fail)
        spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    public fun test_initialize(admin: &signer, framework: &signer) {
        // Set up timestamp for testing
        timestamp::set_time_has_started_for_testing(framework);
        // Test that initialize can be called successfully
        spacelyapp::initialize(admin);

        // After initialization, we should be able to create a profile
        let profile = spacelyapp::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(TWITTER_URL)
        );

        // Verify profile was created successfully
        let (name, _, _, _, _, _, _, addr) = spacelyapp::get_profile(profile);
        assert!(string::bytes(&name) == &USERNAME, 1);
        assert!(addr == signer::address_of(admin), 2);
    }

    #[test(admin = @spacely1, framework = @aptos_framework)]
    #[expected_failure] // Should fail when trying to initialize twice
    public fun test_duplicate_initialize(admin: &signer, framework: &signer) {
        // Set up timestamp for testing
        timestamp::set_time_has_started_for_testing(framework);
        // First initialization
        spacelyapp::initialize(admin);
        
        // Second initialization should fail
        spacelyapp::initialize(admin);
    }
}