$('#slackchannels').on('click', 'span.close', function () {
    $(this).fadeOut(100);
    var row = $(this).parents('tr');
    var newRow = "<tr><td colspan=\"2\"><div id=\"slack_placeholder\"/></tr></tr>";

    newRow = $(newRow).insertAfter(row);
    var placeholder = newRow.find("#slack_placeholder");

    confirm_delete("Are you sure you want to remove slack channel logs from the morgue entry?", placeholder, this, function() {
        var self = $(this);
        var id = $(this).attr("id").split("-")[1];
        delete_slack_channel_for_event(get_current_event_id(), id, function(data) {
            ($(self).parents('.channel-row')).remove();
        });
    }, function() {
        $(this).fadeIn(100);
        newRow.remove();
        fetch_slack_conversation();
    });

});


$("#slack_channels_select").chosen().change(function() {
    $("select#slack_channels_select option:selected").each(function () {
        var channel = $(this);
        var channel_id  = $(this).val();
        var channel_name= $(this).text();
        store_slack_channel_info_for_event(get_current_event_id(), channel_id, channel_name, function(data) {
            data = JSON.parse(data);
            for (var i in data) {
                if (data[i].channel_name == channel_name) {
                    var entry = "<tr class=\"channel-row\">";
                    entry += "<td><a role=\"button\" class=\"btn slackshow\" >"+data[i].channel_name+"</a></td>";
                    entry += "<td><span id=\"channel-"+data[i].id+"\" class=\"close\">&times;</span></td>";
                    entry += "</tr>";
                    $('#channel_table_body').append(entry);
                    channel.prop("selected", false);
                    $("#slack_channels_select").trigger("liszt:updated");
                }
            }
        });

    });
});


function display_slack_channels_data(channels) {
    var html="";
    for (var i in channels) {
        var el = channels[i];
        html += "<p>[" +el.time +"] &lt " +el.nick+"&gt: " +el.message+"</p>";
    }
    $('#slack-loader').hide();
    $('#slack-modal-body').html(html);
}

function display_slack_not_implemented(jqXHR, textStatus, errorThrown) {
    var html='<div class="alert alert-danger">';
    if (jqXHR.status == "404") {
        html += 'Slack history feature not implemented';
    } else {
        html += 'The server encountered an error while retrieving Slack logs';
    }
    html += '</div>';
    $('#slack-loader').hide();
    $('#slack-modal-body').html(html);
}


$('#pull-channel-conversations').on('click', function (){
    fetch_slack_conversation();
});


$("#slackmodal").on("click", ".slack_paste", function () {
    var channel_name = $("#slack-modal-headline").html();
    var content = "\n\n#### " + channel_name + "\n";
    content += $("#slackmodal").find("#slack-modal-body").text();
    // place on separate lines
    content = content.replace(/\[(\d)/g, "\n\n [$1");
    // create links
    content = content.replace(/(https?:\/\/\S*)/g, "<$1>");
    // highlight time
    content = content.replace(/(\[\d{2}:\d{2}:\d{2} [A|P]M\])/g, "*$1*");
    // highlight speaker name
    content = content.replace(/(< \S*>)/g, "**$1**");
    make_summary_editable(content);
    $("#summaryeditbutton").html("Save");
    $("#summarycancelbutton").show();
});



/**
 * function to store an Slack channel for an event via the REST API
 *
 * @param id - event ID
 * @param image - the channel name to store
 * @param callback - callback function
 *
 */
function store_slack_channel_info_for_event(id, channel_id, channel_name, callback) {
    var url = "/events/" + id + "/slack-channels";
    var data = {"channel_id": channel_id, "channel_name": channel_name};
    $.post(url, data, callback);
}

/**
 * function to delete a channel name for an event via the REST API
 *
 * @param id - event ID
 * @param channel_id - the channel id to delete
 * @param callback - callback function
 */
function delete_slack_channel_for_event(event_id, channel_id, callback) {
    var url = "/events/" + event_id + "/slack-channels/"+channel_id;
    $.ajax_delete(url, callback);
}


function fetch_slack_conversation() {
    var startDate = $("#event-start-input-date").attr("value").replace(/\//g, '-');
    var startTime = $("#event-start-input-time").attr("value");

    var endDate = $("#event-end-input-date").attr("value").replace(/\//g, '-');
    var endTime = $("#event-end-input-time").attr("value");

    var startDateTime = startDate + " "+startTime;
    var endDateTime   = endDate + " "+endTime;

    var url = "/events/" + get_current_event_id() + "/slack-channels-messages/" + startDateTime + "/" + endDateTime;
    $("#channel_messages").html('Fetching data...');
    $.get(url, function (d) {
        $("#channel_messages").html(d);
    });
}