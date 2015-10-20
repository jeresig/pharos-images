$(function() {
    $("#selectArtist").select2({
        placeholder: "Search by Artist",
        minimumInputLength: 1,
        allowClear: true,
        ajax: {
            url: "/artists/search",
            dataType: "json",
            data: function(term) {
                return {q: term};
            },
            results: function(data) {
                return {
                    results: data.matches,
                    text: function(i) {
                        return data.matches[i].name.name;
                    }
                };
            }
        }
    });

    // Source selection in the search sidebar
    $("select[name=qsource]").select2();

    $(".date-range-picker").ionRangeSlider({
        type: "double",
        prettify_enabled: false,
        input_values_separator: ";",
        step: 5
    });
});