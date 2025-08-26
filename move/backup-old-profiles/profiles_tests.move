#[test_only]
module spacely3::profiles_tests {
    use std::string::{String, Self};
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use spacely3::profiles3 as profiles;

    // Test constants
    const USERNAME: vector<u8> = b"testuser";
    const PROFILE_IMG: vector<u8> = b"https://example.com/img.jpg";
    const AFFILIATION: vector<u8> = b"Test Org";
    const BIO: vector<u8> = b"Test bio";
    const TEST_MESSAGE: vector<u8> = b"Hello, this is a test message!";
    const BADGE_HASH: vector<u8> = b"badge123";

    fun setup(admin: &signer, framework: &signer) {
        // Set up timestamp for testing
        timestamp::set_time_has_started_for_testing(framework);
        // Initialize the module
        profiles::init_module_for_test(admin);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_profile_creation(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        // Verify profile data
        let (name, bio, img, affil, friend_count, _, _, addr) = profiles::get_profile(profile);
        assert!(string::bytes(&name) == &USERNAME, 1);
        assert!(string::bytes(&bio) == &BIO, 2);
        assert!(string::bytes(&img) == &PROFILE_IMG, 3);
        assert!(string::bytes(&affil) == &AFFILIATION, 4);
        assert!(friend_count == 0, 5);
        assert!(addr == signer::address_of(admin), 6);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_update_profile(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        // Update profile
        let new_bio = string::utf8(b"Updated bio");
        let new_img = string::utf8(b"new_img.jpg");
        let new_affil = string::utf8(b"New Org");

        profiles::update_bio(admin, profile, new_bio);
        profiles::update_profile_image(admin, profile, new_img);
        profiles::update_affiliation(admin, profile, new_affil);

        // Verify updates
        let (_, bio, img, affil, _, _, _, _) = profiles::get_profile(profile);
        assert!(string::bytes(&bio) == string::bytes(&new_bio), 1);
        assert!(string::bytes(&img) == string::bytes(&new_img), 2);
        assert!(string::bytes(&affil) == string::bytes(&new_affil), 3);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_friend_operations(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile1 = profiles::create_profile(
            admin,
            string::utf8(b"user1"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        let profile2 = profiles::create_profile(
            admin,
            string::utf8(b"user2"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        // Add friend
        profiles::add_friend(admin, profile1, profile2);
        assert!(profiles::is_friend(profile1, profile2), 1);

        // Remove friend
        profiles::remove_friend(admin, profile1, profile2);
        assert!(!profiles::is_friend(profile1, profile2), 2);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_badge_operations(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        let badge = string::utf8(BADGE_HASH);
        profiles::add_badge(admin, profile, badge);

        let badges = profiles::get_badges(profile);
        assert!(vector::contains(&badges, &badge), 1);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_messaging(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile1 = profiles::create_profile(
            admin,
            string::utf8(b"user1"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        let profile2 = profiles::create_profile(
            admin,
            string::utf8(b"user2"),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        profiles::send_message(profile1, profile2, string::utf8(TEST_MESSAGE));

        // Delete message
        profiles::delete_message(profile1, 0);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_space_operations(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        let topics = vector::empty<String>();
        vector::push_back(&mut topics, string::utf8(b"Move"));
        vector::push_back(&mut topics, string::utf8(b"Blockchain"));

    // Use a valid future start_time for tests
    let start_time = timestamp::now_seconds() + 3600;

    profiles::create_space(
        admin,
        profile,
        string::utf8(b"Move Language Tutorial"),
        start_time, // start_time (1 hour from now)
        60, // duration in minutes
            string::utf8(b"English"),
            topics,
            0, // category
            100, // max_participants
            string::utf8(b""), // description
            false, // is_recurring
            0 // recurring_interval
        );

        let spaces = profiles::get_spaces(profile);
        assert!(vector::length(&spaces) == 1, 1);

        // Update space
        let new_topics = vector::empty<String>();
        vector::push_back(&mut new_topics, string::utf8(b"Move"));
        vector::push_back(&mut new_topics, string::utf8(b"Smart Contracts"));

        profiles::update_space(
            admin,
            profile,
            0, // space_id
            string::utf8(b"Advanced Move Tutorial"),
            1, // new_start_time
            new_topics
        );

        let updated_spaces = profiles::get_spaces(profile);
        let space = *vector::borrow(&updated_spaces, 0);
        assert!(profiles::get_space_name(space) == string::utf8(b"Advanced Move Tutorial"), 2);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    public fun test_transfer_and_mutability(admin: &signer, framework: &signer) {
        setup(admin, framework);

        let profile = profiles::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        // Verify initial mutability
        assert!(profiles::is_mutable(profile), 1);

        // Disable transfers
        profiles::disable_transfer(admin, profile);
        assert!(!profiles::is_mutable(profile), 2);
    }

    #[test(admin = @spacely3, framework = @aptos_framework)]
    #[expected_failure(abort_code = 524289, location = spacely3::profiles3)]
    public fun test_duplicate_username(admin: &signer, framework: &signer) {
        setup(admin, framework);
        
        // Create first profile
        profiles::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );

        // Try to create second profile with same username (should fail)
        profiles::create_profile(
            admin,
            string::utf8(USERNAME),
            string::utf8(BIO),
            string::utf8(PROFILE_IMG),
            string::utf8(AFFILIATION),
            string::utf8(b"")
        );
    }
}
