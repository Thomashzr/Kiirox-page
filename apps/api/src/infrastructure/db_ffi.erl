-module(db_ffi).
-export([start_pool/1]).

-include_lib("pog/include/pog_Config.hrl").

start_pool(Config) ->
    application:set_env(pg_types, timestamp_config, integer_system_time_microseconds),
    #config{
        pool_name = PoolName,
        host = HostBin,
        port = Port,
        database = Database,
        user = User,
        password = Password,
        ssl = Ssl,
        connection_parameters = ConnectionParameters,
        pool_size = PoolSize,
        queue_target = QueueTarget,
        queue_interval = QueueInterval,
        idle_interval = IdleInterval,
        trace = Trace,
        ip_version = IpVersion,
        rows_as_map = RowsAsMap
    } = Config,

    HostList = case is_binary(HostBin) of
        true -> binary_to_list(HostBin);
        false -> HostBin
    end,

    {SslActivated, SslOptions} = case Ssl of
        ssl_disabled -> {false, []};
        ssl_unverified -> {true, [
            {verify, verify_none},
            {server_name_indication, HostList}
        ]};
        ssl_verified -> {true, [
            {verify, verify_peer},
            {cacerts, public_key:cacerts_get()},
            {server_name_indication, HostList},
            {customize_hostname_check, [
                {match_fun, public_key:pkix_verify_hostname_match_fun(https)}
            ]}
        ]}
    end,

    Options1 = #{
        host => HostList,
        port => Port,
        database => Database,
        user => User,
        ssl => SslActivated,
        ssl_options => SslOptions,
        connection_parameters => ConnectionParameters,
        pool_size => PoolSize,
        queue_target => QueueTarget,
        queue_interval => QueueInterval,
        idle_interval => IdleInterval,
        trace => Trace,
        decode_opts => [{return_rows_as_maps, RowsAsMap}],
        socket_options => case IpVersion of
            ipv4 -> [];
            ipv6 -> [inet6]
        end
    },
    Options2 = case Password of
        {some, Pw} -> maps:put(password, Pw, Options1);
        none -> Options1
    end,
    pgo_pool:start_link(PoolName, Options2).
